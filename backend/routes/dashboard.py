import time
from flask import Blueprint, jsonify, g
from services.db import get_db
from middleware.auth_guard import auth_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/stats", methods=["GET"])
@auth_required
def get_dashboard_stats():
    user_id = g.current_user["_id"]
    db = get_db()

    # Query URL scans for this user
    url_scans_cursor = db.url_scans.find({"user_id": user_id})
    url_scans = list(url_scans_cursor)

    total_urls = len(url_scans)
    working_links = 0
    broken_links = 0
    redirected_links = 0
    access_restricted = 0
    safe_reputation = 0
    unsafe_reputation = 0
    unknown_reputation = 0

    for scan in url_scans:
        avail = scan.get("availability_status")
        if avail == "WORKING":
            working_links += 1
        elif avail == "BROKEN":
            broken_links += 1
        elif avail == "REDIRECTED":
            redirected_links += 1
        elif avail in ("ACCESS_RESTRICTED", "BLOCKED_SSRF"):
            access_restricted += 1

        rep = scan.get("reputation_status")
        sec = scan.get("security_status") or scan.get("security_verdict")
        effective_rep = sec or rep
        if effective_rep in ("SAFE", "NO_INDICATORS_FOUND"):
            safe_reputation += 1
        elif effective_rep in ("UNSAFE", "HIGH_RISK"):
            unsafe_reputation += 1
        else:
            # MODERATE, UNREACHABLE, UNKNOWN, NOT_CHECKED, POTENTIALLY_SUSPICIOUS
            unknown_reputation += 1

    # Query APK scans for this user
    apk_scans_cursor = db.apk_scans.find({"user_id": user_id})
    apk_scans = list(apk_scans_cursor)

    apk_analyzed = len(apk_scans)
    threats_detected = 0
    apk_inconclusive = 0

    for apk in apk_scans:
        overall = apk.get("overall_status")
        rep = apk.get("reputation_status")
        if overall in ("UNSAFE", "MALWARE_DETECTED") or rep == "UNSAFE":
            threats_detected += 1
        elif overall in ("INCONCLUSIVE", "POTENTIALLY_RISKY"):
            apk_inconclusive += 1

    # Recent scans combined (URL + APK), sorted by timestamp desc
    recent_items = []
    for u in url_scans[-10:]:
        recent_items.append({
            "id": str(u["_id"]),
            "type": "URL",
            "target": u.get("submitted_url"),
            "status": u.get("availability_status"),
            "reputation": u.get("security_status") or u.get("reputation_status") or "UNKNOWN",
            "timestamp": u.get("created_at")
        })

    for a in apk_scans[-10:]:
        recent_items.append({
            "id": str(a["_id"]),
            "type": "APK",
            "target": a.get("filename"),
            "status": a.get("overall_status"),
            "reputation": a.get("reputation_status"),
            "timestamp": a.get("created_at")
        })

    recent_items.sort(key=lambda x: x.get("timestamp") or 0, reverse=True)
    recent_scans = recent_items[:10]

    stats = {
        "total_urls_scanned": total_urls,
        "working_links": working_links,
        "broken_links": broken_links,
        "redirected_links": redirected_links,
        "access_restricted_links": access_restricted,
        "safe_reputation_results": safe_reputation,
        "unsafe_reputation_results": unsafe_reputation,
        "unknown_results": unknown_reputation,
        "apk_files_analyzed": apk_analyzed,
        "threats_detected": threats_detected,
        "apk_inconclusive_results": apk_inconclusive,
        "recent_scans": recent_scans
    }

    return jsonify({"stats": stats}), 200
