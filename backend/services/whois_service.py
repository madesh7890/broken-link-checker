import os
import time
import requests
from urllib.parse import urlparse
from datetime import datetime, timezone
from config import Config

class WhoisService:
    @staticmethod
    def get_domain_info(url_or_domain: str) -> dict:
        """
        Retrieves domain registration info, creation date, domain age, and registrar.
        Uses VirusTotal Domain API v3 with Verisign RDAP fallback.
        Never raises exceptions; always returns clean structured dictionary.
        """
        raw = (url_or_domain or "").strip().lower()
        if "://" in raw:
            try:
                hostname = urlparse(raw).hostname or raw
            except Exception:
                hostname = raw
        else:
            hostname = raw.split("/")[0].split(":")[0]

        domain_parts = hostname.split(".")
        if len(domain_parts) >= 2:
            if len(domain_parts) > 2 and domain_parts[-2] in ("co", "com", "gov", "ac", "org", "net", "edu"):
                target_domain = ".".join(domain_parts[-3:])
            else:
                target_domain = ".".join(domain_parts[-2:])
        else:
            target_domain = hostname

        result = {
            "domain": target_domain,
            "hostname": hostname,
            "created_date": None,
            "expires_date": None,
            "registrar": None,
            "age_days": None,
            "age_formatted": "Unknown",
            "is_newly_registered": False,
            "status": "UNAVAILABLE",
            "risk_assessment": "NEUTRAL"
        }

        if not target_domain or target_domain in ("localhost", "127.0.0.1") or all(p.isdigit() for p in domain_parts):
            return result

        # 1. Try VirusTotal v3 domain endpoint if key is present
        vt_key = Config.VIRUSTOTAL_API_KEY or os.getenv("VIRUSTOTAL_API_KEY")
        if vt_key:
            try:
                vt_resp = requests.get(
                    f"https://www.virustotal.com/api/v3/domains/{target_domain}",
                    headers={"x-apikey": vt_key, "User-Agent": "BrokenLinkChecker/1.0"},
                    timeout=3.5
                )
                if vt_resp.status_code == 200:
                    attrs = vt_resp.json().get("data", {}).get("attributes", {})
                    creation_ts = attrs.get("creation_date")
                    registrar = attrs.get("registrar")

                    if creation_ts and isinstance(creation_ts, (int, float)):
                        created_dt = datetime.fromtimestamp(creation_ts, tz=timezone.utc)
                        result["created_date"] = created_dt.strftime("%Y-%m-%d")
                        now = datetime.now(timezone.utc)
                        diff = now - created_dt
                        days = max(0, diff.days)
                        result["age_days"] = days
                        result["registrar"] = registrar or "Protected / Private"
                        result["status"] = "VERIFIED"

                        if days < 30:
                            result["age_formatted"] = f"{days} days old (Brand New / High Phishing Risk)"
                            result["is_newly_registered"] = True
                            result["risk_assessment"] = "HIGH_RISK"
                        elif days < 180:
                            months = max(1, days // 30)
                            result["age_formatted"] = f"{months} month(s) old (Recent Domain)"
                            result["risk_assessment"] = "MODERATE"
                        elif days < 365:
                            months = days // 30
                            result["age_formatted"] = f"{months} months old"
                            result["risk_assessment"] = "NEUTRAL"
                        else:
                            years = round(days / 365.25, 1)
                            result["age_formatted"] = f"{years} years old (Established & Trusted)"
                            result["risk_assessment"] = "TRUSTED"

                        return result
            except Exception:
                pass

        # 2. Fallback: Verisign RDAP for .com and .net
        if target_domain.endswith(".com") or target_domain.endswith(".net"):
            try:
                rdap_resp = requests.get(
                    f"https://rdap.verisign.com/com/v1/domain/{target_domain}",
                    headers={"User-Agent": "Mozilla/5.0"},
                    timeout=3.0
                )
                if rdap_resp.status_code == 200:
                    rdap_data = rdap_resp.json()
                    events = rdap_data.get("events") or []
                    created_dt = None
                    for ev in events:
                        if ev.get("eventAction") in ("registration", "transfer") and ev.get("eventDate"):
                            clean_d = ev["eventDate"][:19]
                            created_dt = datetime.fromisoformat(clean_d)
                            break
                    if created_dt:
                        if created_dt.tzinfo is None:
                            created_dt = created_dt.replace(tzinfo=timezone.utc)
                        result["created_date"] = created_dt.strftime("%Y-%m-%d")
                        days = max(0, (datetime.now(timezone.utc) - created_dt).days)
                        result["age_days"] = days
                        result["status"] = "VERIFIED"
                        if days < 30:
                            result["age_formatted"] = f"{days} days old (Brand New)"
                            result["is_newly_registered"] = True
                            result["risk_assessment"] = "HIGH_RISK"
                        elif days < 365:
                            result["age_formatted"] = f"{days // 30} months old"
                            result["risk_assessment"] = "MODERATE"
                        else:
                            years = round(days / 365.25, 1)
                            result["age_formatted"] = f"{years} years old (Established)"
                            result["risk_assessment"] = "TRUSTED"

                        # Find registrar
                        for ent in rdap_data.get("entities", []):
                            if "registrar" in (ent.get("roles") or []):
                                vcard = ent.get("vcardArray")
                                if vcard and len(vcard) > 1:
                                    for prop in vcard[1]:
                                        if len(prop) > 3 and prop[0] == "fn":
                                            result["registrar"] = prop[3]
                                            break
                                break
                        return result
            except Exception:
                pass

        return result
