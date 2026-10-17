import time
import requests
from config import Config
from services.db import get_db

class ReputationService:
    @staticmethod
    def get_cached_result(query_key: str):
        try:
            db = get_db()
            cached = db.reputation_cache.find_one({"query_key": query_key})
            if cached:
                return cached.get("result")
        except Exception:
            pass
        return None

    @staticmethod
    def set_cached_result(query_key: str, result: dict):
        try:
            db = get_db()
            db.reputation_cache.update_one(
                {"query_key": query_key},
                {"$set": {
                    "query_key": query_key,
                    "result": result,
                    "cached_at": time.time()
                }},
                upsert=True
            )
        except Exception:
            pass

    @classmethod
    def check_url_reputation(cls, url: str) -> dict:
        """
        Queries Google Safe Browsing Lookup API v4 (if configured).
        Falls back safely without fabricating results if unconfigured or error occurs.
        """
        api_key = Config.SAFE_BROWSING_API_KEY
        cache_key = f"url:{url}"
        cached = cls.get_cached_result(cache_key)
        if cached:
            return cached

        if not api_key:
            res = {
                "service": "Google Safe Browsing",
                "status": "UNKNOWN",
                "is_configured": False,
                "threat_types": [],
                "reason": "External reputation checking is currently unavailable (API key not configured). Security status remains unknown.",
                "details": "Basic URL and connectivity analysis available; external reputation check skipped."
            }
            return res

        endpoint = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={api_key}"
        payload = {
            "client": {
                "clientId": "broken-link-checker",
                "clientVersion": "1.0.0"
            },
            "threatInfo": {
                "threatTypes": [
                    "MALWARE",
                    "SOCIAL_ENGINEERING",
                    "UNWANTED_SOFTWARE",
                    "POTENTIALLY_HARMFUL_APPLICATION"
                ],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}]
            }
        }

        try:
            resp = requests.post(endpoint, json=payload, timeout=6)
            if resp.status_code == 200:
                data = resp.json()
                matches = data.get("matches", [])
                if matches:
                    threat_types = list(set([m.get("threatType") for m in matches]))
                    res = {
                        "service": "Google Safe Browsing",
                        "status": "UNSAFE",
                        "is_configured": True,
                        "threat_types": threat_types,
                        "reason": f"Flagged by Google Safe Browsing as: {', '.join(threat_types)}",
                        "details": matches
                    }
                else:
                    res = {
                        "service": "Google Safe Browsing",
                        "status": "SAFE",
                        "is_configured": True,
                        "threat_types": [],
                        "reason": "No known threat was reported by Google Safe Browsing.",
                        "details": "Lookup returned 0 threat matches."
                    }
                cls.set_cached_result(cache_key, res)
                return res
            elif resp.status_code == 429:
                return {
                    "service": "Google Safe Browsing",
                    "status": "UNKNOWN",
                    "is_configured": True,
                    "threat_types": [],
                    "reason": "Reputation service rate limit exceeded or quota exhausted. Security status remains unknown.",
                    "details": f"HTTP {resp.status_code} response from API provider."
                }
            elif resp.status_code in (400, 403):
                return {
                    "service": "Google Safe Browsing",
                    "status": "UNKNOWN",
                    "is_configured": True,
                    "threat_types": [],
                    "reason": "Reputation API key is invalid or unauthorized. Security status remains unknown.",
                    "details": f"HTTP {resp.status_code} response: {resp.text[:100]}"
                }
            else:
                return {
                    "service": "Google Safe Browsing",
                    "status": "UNKNOWN",
                    "is_configured": True,
                    "threat_types": [],
                    "reason": f"Reputation service returned server error ({resp.status_code}). Security status remains unknown.",
                    "details": resp.text[:100]
                }
        except requests.exceptions.Timeout:
            return {
                "service": "Google Safe Browsing",
                "status": "UNKNOWN",
                "is_configured": True,
                "threat_types": [],
                "reason": "Reputation service request timed out. Security status remains unknown.",
                "details": "Timeout after 6 seconds."
            }
        except requests.exceptions.RequestException as e:
            return {
                "service": "Google Safe Browsing",
                "status": "SCAN FAILED",
                "is_configured": True,
                "threat_types": [],
                "reason": f"Reputation service connection failed: {str(e)}",
                "details": "Network or transport error while reaching Google Safe Browsing."
            }

    @classmethod
    def check_apk_hash_reputation(cls, sha256_hash: str) -> dict:
        """
        Queries VirusTotal / malware hash lookup (if configured).
        Falls back safely to UNKNOWN / UNAVAILABLE when not configured.
        """
        api_key = Config.VIRUSTOTAL_API_KEY
        cache_key = f"hash:{sha256_hash}"
        cached = cls.get_cached_result(cache_key)
        if cached:
            return cached

        if not api_key:
            return {
                "service": "VirusTotal / Malware Reputation",
                "status": "UNKNOWN",
                "is_configured": False,
                "positives": 0,
                "total": 0,
                "reason": "External malware hash reputation checking is not configured. Local static analysis findings are displayed; malware status remains unknown.",
                "details": "API key not set in environment."
            }

        endpoint = f"https://www.virustotal.com/api/v3/files/{sha256_hash}"
        headers = {"x-apikey": api_key}

        try:
            resp = requests.get(endpoint, headers=headers, timeout=7)
            if resp.status_code == 200:
                data = resp.json()
                attrs = data.get("data", {}).get("attributes", {})
                stats = attrs.get("last_analysis_stats", {})
                malicious = stats.get("malicious", 0)
                suspicious = stats.get("suspicious", 0)
                undetected = stats.get("undetected", 0)
                harmless = stats.get("harmless", 0)
                total = malicious + suspicious + undetected + harmless

                # Extract popular threat classification & AV names
                popular_threat = attrs.get("popular_threat_classification", {})
                suggested_label = popular_threat.get("suggested_threat_label", "")
                popular_cats = [c.get("value") for c in popular_threat.get("popular_threat_category", []) if c.get("value")]

                detected_threat_names = []
                analysis_results = attrs.get("last_analysis_results", {})
                for engine, eng_res in analysis_results.items():
                    if eng_res.get("category") == "malicious" and eng_res.get("result"):
                        res_name = eng_res.get("result")
                        if res_name not in detected_threat_names:
                            detected_threat_names.append(res_name)

                if malicious > 0:
                    status = "UNSAFE"
                    primary_threat = suggested_label or (detected_threat_names[0] if detected_threat_names else "Malware")
                    reason = f"Confirmed Threat: Flagged as '{primary_threat}' by {malicious} security engine(s)."
                else:
                    status = "SAFE"
                    primary_threat = None
                    reason = f"No engines flagged this hash as malicious out of {total} checked."

                res = {
                    "service": "VirusTotal",
                    "status": status,
                    "is_configured": True,
                    "positives": malicious,
                    "suspicious": suspicious,
                    "total": total,
                    "threat_label": suggested_label,
                    "primary_threat": primary_threat,
                    "threat_categories": popular_cats,
                    "detected_threat_names": detected_threat_names[:10],
                    "reason": reason,
                    "details": stats
                }
                cls.set_cached_result(cache_key, res)
                return res
            elif resp.status_code == 404:
                # Hash not found in database - not necessarily clean!
                return {
                    "service": "VirusTotal",
                    "status": "UNKNOWN",
                    "is_configured": True,
                    "positives": 0,
                    "total": 0,
                    "reason": "Hash not found in VirusTotal database. Inconclusive result; status remains unknown.",
                    "details": "404 Not Found"
                }
            elif resp.status_code == 429:
                return {
                    "service": "VirusTotal",
                    "status": "UNKNOWN",
                    "is_configured": True,
                    "positives": 0,
                    "total": 0,
                    "reason": "VirusTotal rate limit exceeded or quota exhausted.",
                    "details": "HTTP 429 Too Many Requests"
                }
            else:
                return {
                    "service": "VirusTotal",
                    "status": "UNKNOWN",
                    "is_configured": True,
                    "positives": 0,
                    "total": 0,
                    "reason": f"External hash lookup returned status {resp.status_code}.",
                    "details": resp.text[:100]
                }
        except requests.exceptions.Timeout:
            return {
                "service": "VirusTotal",
                "status": "UNKNOWN",
                "is_configured": True,
                "positives": 0,
                "total": 0,
                "reason": "External hash lookup timed out.",
                "details": "Timeout after 7 seconds"
            }
        except requests.exceptions.RequestException as e:
            return {
                "service": "VirusTotal",
                "status": "UNKNOWN",
                "is_configured": True,
                "positives": 0,
                "total": 0,
                "reason": f"External hash lookup network failure: {str(e)}",
                "details": "Connection failed"
            }

    @classmethod
    def get_integration_statuses(cls) -> dict:
        return {
            "google_safe_browsing": {
                "name": "Google Safe Browsing",
                "type": "URL Threat Reputation",
                "configured": bool(Config.SAFE_BROWSING_API_KEY),
                "status": "Configured and available" if Config.SAFE_BROWSING_API_KEY else "Not configured",
                "fallback_mode": "Local HTTP & DNS validation active"
            },
            "virustotal": {
                "name": "VirusTotal",
                "type": "Malware Hash Reputation",
                "configured": bool(Config.VIRUSTOTAL_API_KEY),
                "status": "Configured and available" if Config.VIRUSTOTAL_API_KEY else "Not configured",
                "fallback_mode": "Local static APK & SHA-256 analysis active"
            }
        }
