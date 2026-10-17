import time
from urllib.parse import urlparse
from flask import Blueprint, request, jsonify, g
from services.db import get_db
from services.url_checker import check_single_url
from services.reputation_service import ReputationService
from services.ssrf_guard import validate_url_safe
from middleware.auth_guard import auth_required, rate_limit

suspicious_bp = Blueprint("suspicious", __name__, url_prefix="/api/suspicious")

def analyze_url_heuristics(url: str, http_result: dict | None = None) -> list[dict]:
    """
    Evidence-based heuristic checks (without jumping to false conclusions)
    """
    findings = []
    try:
        parsed = urlparse(url)
    except Exception:
        return findings

    hostname = (parsed.hostname or "").lower()

    # 1. IP address used as hostname
    parts = hostname.split(".")
    if len(parts) == 4 and all(p.isdigit() for p in parts):
        findings.append({
            "type": "IP_HOSTNAME",
            "severity": "HIGH",
            "title": "Raw IP Address Hostname",
            "description": "URL points directly to an IP address rather than a domain name, a common trait of deceptive links."
        })

    # 2. Punycode / IDN homograph attack
    if "xn--" in hostname:
        findings.append({
            "type": "PUNYCODE_HOMOGRAPH",
            "severity": "HIGH",
            "title": "Internationalized Domain / Punycode (Homograph Risk)",
            "description": f"Hostname '{hostname}' uses Punycode encoding, often used in IDN spoofing to imitate trusted brands with lookalike characters."
        })

    # 3. Misleading brand spoofing in subdomain
    trusted_brands = ["paypal", "google", "apple", "microsoft", "amazon", "netflix", "facebook", "instagram", "chase", "bankofamerica", "wellsfargo"]
    for brand in trusted_brands:
        if brand in hostname:
            is_legit = hostname == f"{brand}.com" or hostname.endswith(f".{brand}.com")
            if not is_legit:
                findings.append({
                    "type": "BRAND_SPOOFING",
                    "severity": "HIGH",
                    "title": f"Possible Brand Spoofing ('{brand}')",
                    "description": f"Domain '{hostname}' embeds the brand '{brand}' in a subdomain or spoofed host without being the authentic brand domain."
                })
                break

    # 4. Credential lure keywords in path or query
    suspicious_keywords = ["login", "verify", "account", "update", "banking", "secure", "signin", "wallet", "password", "reset-pin"]
    path_and_query = (parsed.path + "?" + (parsed.query or "")).lower()
    matched_keywords = [kw for kw in suspicious_keywords if kw in path_and_query]
    if matched_keywords:
        findings.append({
            "type": "CREDENTIAL_KEYWORDS",
            "severity": "WARNING",
            "title": "Credential Lure Keywords Present",
            "description": f"URL path/query contains sensitive keywords frequently targeted in phishing lures: {', '.join(matched_keywords)}."
        })

    # 5. Excessive subdomains
    if hostname.count(".") >= 4:
        findings.append({
            "type": "DEEP_SUBDOMAIN",
            "severity": "WARNING",
            "title": "Multiple Subdomain Levels",
            "description": f"Hostname '{hostname}' contains multiple subdomain levels, which may indicate domain shadowing or spoofing attempts."
        })

    # 6. Redirection hops (if HTTP result available)
    if http_result:
        chain = http_result.get("redirect_chain", [])
        if len(chain) > 1:
            findings.append({
                "type": "MULTIPLE_REDIRECTS",
                "severity": "WARNING",
                "title": f"Multiple Redirection Hops ({len(chain)} hops)",
                "description": "Link redirects across multiple destinations, often used to bypass email security gateways."
            })

    # 7. Non-standard port
    if parsed.port and parsed.port not in (80, 443, 8080, 8443):
        findings.append({
            "type": "NON_STANDARD_PORT",
            "severity": "WARNING",
            "title": f"Non-Standard Port ({parsed.port})",
            "description": f"Connecting over unusual web port {parsed.port}."
        })

    return findings

@suspicious_bp.route("/scan", methods=["POST"])
@auth_required
@rate_limit(max_requests=30, window_seconds=60)
def scan_suspicious_url():
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    if url and "://" not in url:
        url = "https://" + url

    if not url:
        return jsonify({"message": "Please provide a URL to inspect."}), 400

    # 1. URL syntax validation
    try:
        parsed = urlparse(url)
        if parsed.scheme.lower() not in ("http", "https"):
            return jsonify({
                "message": f"Unsupported protocol '{parsed.scheme}'. Only HTTP and HTTPS are permitted.",
                "status": "SCAN FAILED"
            }), 400
        if not parsed.hostname:
            return jsonify({
                "message": "URL must contain a valid hostname or domain name.",
                "status": "SCAN FAILED"
            }), 400
    except Exception as e:
        return jsonify({"message": f"Malformed URL syntax: {str(e)}", "status": "SCAN FAILED"}), 400

    # 2. SSRF check
    is_safe, error_msg, details = validate_url_safe(url)
    db = get_db()
    now = time.time()

    # Case A: SSRF Blocked (Loopback, Private IP, Cloud Metadata, Internal Hostname)
    if not is_safe and details.get("error_type") == "SSRF_BLOCKED":
        heuristics = [{
            "type": "SSRF_BLOCKED",
            "severity": "CRITICAL",
            "title": "Internal / Restricted Target Blocked",
            "description": error_msg
        }]
        scan_doc = {
            "user_id": g.current_user["_id"],
            "scan_type": "suspicious",
            "submitted_url": url,
            "final_url": url,
            "http_status": None,
            "response_time_ms": 0,
            "redirect_chain": [],
            "availability_status": "ACCESS_RESTRICTED",
            "security_status": "UNSAFE",
            "risk_level": "HIGH_RISK",
            "status_title": "High Risk: SSRF / Internal Resource Blocked",
            "reputation_status": "NOT_APPLICABLE",
            "reputation_details": {"service": "SSRF Guard", "status": "UNSAFE", "reason": error_msg},
            "heuristics": heuristics,
            "verdict_explanation": f"Security Block (SSRF): Host resolves to restricted private/internal address ({error_msg}).",
            "error": error_msg,
            "created_at": now
        }
        res = db.url_scans.insert_one(scan_doc)
        scan_doc["_id"] = str(res.inserted_id)
        return jsonify({
            "message": "Security Block: Target resolves to an internal restricted resource.",
            "scan": scan_doc
        }), 200

    # Case B: DNS Resolution Failed (Domain does not exist or unreachable)
    if not is_safe and details.get("error_type") in ("DNS_ERROR", "NETWORK_ERROR"):
        # Still run heuristic checks on the URL syntax
        heuristics = analyze_url_heuristics(url, None)
        reputation_res = ReputationService.check_url_reputation(url)
        rep_status = reputation_res.get("status", "UNKNOWN")

        # Determine risk: Never label malicious solely because domain is unreachable
        if rep_status == "UNSAFE":
            sec_status = "UNSAFE"
            risk_level = "HIGH_RISK"
            status_title = "High Risk: Threat Detected (Domain Currently Unreachable)"
            verdict_exp = f"Google Safe Browsing reported a threat ({reputation_res.get('reason')}), but the host is currently unreachable via DNS."
        elif any(h.get("severity") == "HIGH" for h in heuristics):
            sec_status = "MODERATE"
            risk_level = "POTENTIALLY_SUSPICIOUS"
            status_title = "Potentially Suspicious (Domain Unreachable)"
            verdict_exp = "URL syntax contains suspicious patterns, and the domain cannot currently be reached or resolved."
        else:
            sec_status = "UNREACHABLE"
            risk_level = "URL_UNREACHABLE"
            status_title = "URL Unreachable"
            verdict_exp = f"The domain '{details.get('hostname')}' cannot be resolved via DNS or reached over the network. Under core security rules, an unreachable domain is not classified as malicious without verified threat evidence."

        scan_doc = {
            "user_id": g.current_user["_id"],
            "scan_type": "suspicious",
            "submitted_url": url,
            "final_url": url,
            "http_status": None,
            "response_time_ms": 0,
            "redirect_chain": [],
            "availability_status": "CONNECTION_FAILED",
            "security_status": sec_status,
            "risk_level": risk_level,
            "status_title": status_title,
            "reputation_status": rep_status,
            "reputation_details": reputation_res,
            "heuristics": heuristics,
            "verdict_explanation": verdict_exp,
            "error": error_msg,
            "created_at": now
        }
        res = db.url_scans.insert_one(scan_doc)
        scan_doc["_id"] = str(res.inserted_id)
        return jsonify({
            "message": "Analysis completed: URL is unreachable.",
            "scan": scan_doc
        }), 200

    # Case C: URL is safe from SSRF and resolves to public IP
    # 3. External reputation service
    reputation_res = ReputationService.check_url_reputation(url)

    # 4. Safe HTTP analysis (isolated header & redirect probing with automatic HTTP fallback)
    had_explicit_scheme = "://" in (data.get("url") or "")
    http_result = check_single_url(url, had_explicit_scheme=had_explicit_scheme)

    # 5. Heuristic analysis
    heuristics = analyze_url_heuristics(url, http_result)

    # 6. Overall Security Status & Risk Level
    rep_status = reputation_res.get("status", "UNKNOWN")
    has_critical_threat = rep_status == "UNSAFE"
    has_high_heuristics = any(h.get("severity") == "HIGH" for h in heuristics)
    has_warning_heuristics = any(h.get("severity") == "WARNING" for h in heuristics)
    is_unreachable = http_result.get("availability_status") == "CONNECTION_FAILED"

    if has_critical_threat:
        security_status = "UNSAFE"
        risk_level = "HIGH_RISK"
        status_title = "High Risk: Verified Threat Detected"
        verdict_explanation = f"UNSAFE: Verified threat reported by Google Safe Browsing: {reputation_res.get('reason')}."
    elif has_high_heuristics:
        security_status = "UNSAFE"
        risk_level = "HIGH_RISK"
        status_title = "High Risk: Deceptive Patterns Detected"
        verdict_explanation = "UNSAFE: Deceptive patterns (e.g. brand spoofing or direct IP hostname) identified."
    elif has_warning_heuristics:
        security_status = "MODERATE"
        risk_level = "POTENTIALLY_SUSPICIOUS"
        status_title = "Potentially Suspicious: Caution Advised"
        verdict_explanation = "POTENTIALLY SUSPICIOUS: Syntactic or redirection indicators observed. Proceed with caution."
    elif is_unreachable:
        security_status = "UNREACHABLE"
        risk_level = "URL_UNREACHABLE"
        status_title = "URL Unreachable"
        verdict_explanation = "URL Unreachable: Host could not be contacted. Unreachable sites are not labeled as malicious without verified evidence."
    else:
        security_status = "SAFE"
        risk_level = "NO_INDICATORS_FOUND"
        status_title = "No Suspicious Indicators Found"
        verdict_explanation = "SAFE: Destination verified. No malicious indicators or threat matches detected."

    # 7. Persist to MongoDB
    scan_doc = {
        "user_id": g.current_user["_id"],
        "scan_type": "suspicious",
        "submitted_url": url,
        "final_url": http_result["final_url"],
        "http_status": http_result["http_status"],
        "response_time_ms": http_result["response_time_ms"],
        "redirect_chain": http_result["redirect_chain"],
        "availability_status": http_result["availability_status"],
        "security_status": security_status,
        "risk_level": risk_level,
        "status_title": status_title,
        "reputation_status": rep_status,
        "reputation_details": reputation_res,
        "heuristics": heuristics,
        "verdict_explanation": verdict_explanation,
        "error": http_result.get("error"),
        "created_at": now
    }

    res = db.url_scans.insert_one(scan_doc)
    scan_doc["_id"] = str(res.inserted_id)

    return jsonify({
        "message": "Suspicious link inspection completed.",
        "scan": scan_doc
    }), 200

