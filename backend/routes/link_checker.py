import time
from flask import Blueprint, request, jsonify, g
from services.db import get_db
from services.url_checker import check_single_url, check_multiple_urls
from services.reputation_service import ReputationService
from middleware.auth_guard import auth_required, optional_auth, rate_limit
from bson import ObjectId

link_checker_bp = Blueprint("link_checker", __name__, url_prefix="/api/links")

@link_checker_bp.route("/check-single", methods=["POST"])
@auth_required
@rate_limit(max_requests=60, window_seconds=60)
def check_single():
    data = request.get_json(silent=True) or {}
    raw_url = (data.get("url") or "").strip()
    had_explicit_scheme = "://" in raw_url
    url = raw_url
    if url and not had_explicit_scheme:
        url = "https://" + url
    include_reputation = data.get("include_reputation", True)

    if not url:
        return jsonify({"message": "Please provide a valid URL to check."}), 400

    # 1. Run HTTP and redirect inspection with SSRF guard and HTTP fallback
    http_result = check_single_url(url, had_explicit_scheme=had_explicit_scheme)

    # 2. Check reputation (Google Safe Browsing or offline fallback)
    reputation_result = None
    if include_reputation:
        reputation_result = ReputationService.check_url_reputation(url)

    # Determine clear final verdict (Security & Reachability)
    avail = http_result.get("availability_status", "UNKNOWN")
    err_str = str(http_result.get("error") or "")
    rep_status = reputation_result.get("status") if reputation_result else None
    http_status = http_result.get("http_status")

    if rep_status == "UNSAFE":
        security_verdict = "UNSAFE"
        verdict_reason = f"Threat confirmed by Google Safe Browsing: {reputation_result.get('reason')}"
    elif "SSRF" in err_str or "restricted destination" in err_str.lower() or "loopback" in err_str.lower():
        security_verdict = "ACCESS_RESTRICTED"
        verdict_reason = "Blocked by SSRF guard: target resolves to restricted internal or loopback IP."
    elif avail == "CONNECTION_FAILED":
        security_verdict = "UNREACHABLE"
        verdict_reason = http_result.get("error") or "Domain could not be reached or resolved."
    elif avail == "BROKEN":
        security_verdict = "BROKEN"
        verdict_reason = f"Broken Link (HTTP {http_status or '404'}): The destination page or resource could not be found."
        if rep_status == "SAFE":
            verdict_reason += " Domain reputation is clean, but the requested endpoint is broken."
    elif avail == "SERVER_ERROR":
        security_verdict = "SERVER_ERROR"
        verdict_reason = f"Server Error (HTTP {http_status or '5xx'}): Destination server encountered an internal failure."
    elif avail == "ACCESS_RESTRICTED":
        security_verdict = "ACCESS_RESTRICTED"
        verdict_reason = f"Access Restricted (HTTP {http_status or '403'}): {http_result.get('error') or 'Authentication required or bot challenge'}."
    elif avail in ("WORKING", "REDIRECTED"):
        security_verdict = "SAFE"
        verdict_reason = "URL is verified reachable, valid, and free of security threats."
    else:
        security_verdict = "SAFE"
        verdict_reason = "URL audit complete. No security threats detected."

    # 3. Store record in MongoDB
    db = get_db()
    scan_doc = {
        "user_id": g.current_user["_id"],
        "scan_type": "standard",
        "submitted_url": http_result["submitted_url"],
        "final_url": http_result["final_url"],
        "http_status": http_result["http_status"],
        "response_time_ms": http_result["response_time_ms"],
        "redirect_chain": http_result["redirect_chain"],
        "availability_status": http_result["availability_status"],
        "security_verdict": security_verdict,
        "security_status": security_verdict,
        "verdict_reason": verdict_reason,
        "tls_valid": http_result["tls_valid"],
        "server": http_result.get("server"),
        "content_type": http_result.get("content_type"),
        "error": http_result["error"],
        "reputation_status": reputation_result.get("status") if reputation_result else "NOT_CHECKED",
        "reputation_details": reputation_result,
        "created_at": time.time()
    }

    insert_res = db.url_scans.insert_one(scan_doc)
    scan_doc["_id"] = str(insert_res.inserted_id)

    return jsonify({
        "message": "URL check completed successfully.",
        "scan": scan_doc
    }), 200

@link_checker_bp.route("/check-batch", methods=["POST"])
@auth_required
@rate_limit(max_requests=20, window_seconds=60)
def check_batch():
    data = request.get_json(silent=True) or {}
    raw_urls = data.get("urls") or []

    if isinstance(raw_urls, str):
        # Support newline-separated strings
        raw_urls = [line.strip() for line in raw_urls.splitlines() if line.strip()]

    if not raw_urls or not isinstance(raw_urls, list):
        return jsonify({"message": "Please provide a list of URLs to scan."}), 400

    if len(raw_urls) > 50:
        return jsonify({"message": "Maximum 50 URLs can be submitted per batch scan."}), 400

    results = check_multiple_urls(raw_urls)

    db = get_db()
    saved_scans = []
    now = time.time()

    for item in results:
        # Check reputation for each batch item
        target_url = item["submitted_url"]
        rep_res = ReputationService.check_url_reputation(target_url)

        item_err = str(item.get("error") or "")
        item_avail = item["availability_status"]
        item_rep = rep_res.get("status") if rep_res else None
        item_status = item.get("http_status")

        if item_rep == "UNSAFE":
            sec_verdict = "UNSAFE"
            sec_reason = f"Threat confirmed by Google Safe Browsing: {rep_res.get('reason')}"
        elif "SSRF" in item_err or "restricted destination" in item_err.lower():
            sec_verdict = "ACCESS_RESTRICTED"
            sec_reason = "Blocked by SSRF guard: target resolves to restricted internal IP."
        elif item_avail == "CONNECTION_FAILED":
            sec_verdict = "UNREACHABLE"
            sec_reason = item.get("error") or "Domain could not be reached or resolved."
        elif item_avail == "BROKEN":
            sec_verdict = "BROKEN"
            sec_reason = f"Broken Link (HTTP {item_status or '404'}): Resource not found."
            if item_rep == "SAFE":
                sec_reason += " Domain reputation is clean, but the resource is dead."
        elif item_avail == "SERVER_ERROR":
            sec_verdict = "SERVER_ERROR"
            sec_reason = f"Server Error (HTTP {item_status or '5xx'}): Upstream failure."
        elif item_avail == "ACCESS_RESTRICTED":
            sec_verdict = "ACCESS_RESTRICTED"
            sec_reason = f"Access Restricted (HTTP {item_status or '403'}): Authentication or bot challenge."
        elif item_avail in ("WORKING", "REDIRECTED"):
            sec_verdict = "SAFE"
            sec_reason = "URL is reachable, valid, and free of security threats."
        else:
            sec_verdict = "SAFE"
            sec_reason = "Verified"

        scan_doc = {
            "user_id": g.current_user["_id"],
            "scan_type": "batch",
            "submitted_url": item["submitted_url"],
            "final_url": item["final_url"],
            "http_status": item["http_status"],
            "response_time_ms": item["response_time_ms"],
            "redirect_chain": item["redirect_chain"],
            "availability_status": item["availability_status"],
            "security_verdict": sec_verdict,
            "security_status": sec_verdict,
            "verdict_reason": sec_reason,
            "tls_valid": item["tls_valid"],
            "server": item.get("server"),
            "content_type": item.get("content_type"),
            "error": item["error"],
            "reputation_status": rep_res.get("status", "NOT_CHECKED") if rep_res else "NOT_CHECKED",
            "reputation_details": rep_res,
            "created_at": now
        }
        res = db.url_scans.insert_one(scan_doc)
        scan_doc["_id"] = str(res.inserted_id)
        saved_scans.append(scan_doc)

    # Calculate summary counters
    counts = {
        "total": len(saved_scans),
        "safe": len([s for s in saved_scans if s["security_verdict"] == "SAFE"]),
        "unsafe": len([s for s in saved_scans if s["security_verdict"] == "UNSAFE"]),
        "unreachable": len([s for s in saved_scans if s["security_verdict"] == "UNREACHABLE"]),
        "access_restricted": len([s for s in saved_scans if s["security_verdict"] in ("ACCESS_RESTRICTED",) or s["availability_status"] == "ACCESS_RESTRICTED"]),
        "working": len([s for s in saved_scans if s["availability_status"] == "WORKING"]),
        "redirected": len([s for s in saved_scans if s["availability_status"] == "REDIRECTED"]),
        "broken": len([s for s in saved_scans if s["availability_status"] == "BROKEN"]),
        "server_error": len([s for s in saved_scans if s["availability_status"] == "SERVER_ERROR"]),
        "connection_failed": len([s for s in saved_scans if s["availability_status"] == "CONNECTION_FAILED"]),
        "unknown": len([s for s in saved_scans if s["availability_status"] == "UNKNOWN"])
    }

    return jsonify({
        "message": f"Batch scan of {len(saved_scans)} URLs completed.",
        "summary": counts,
        "scans": saved_scans
    }), 200
