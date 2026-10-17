from flask import Blueprint, request, jsonify, g
from services.db import get_db
from middleware.auth_guard import auth_required
from bson import ObjectId

history_bp = Blueprint("history", __name__, url_prefix="/api/history")

@history_bp.route("", methods=["GET"])
@auth_required
def get_user_history():
    user_id = g.current_user["_id"]
    db = get_db()

    scan_type = request.args.get("type", "all").lower()
    search = request.args.get("search", "").strip()
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    skip = (page - 1) * limit

    items = []

    # URL scans
    if scan_type in ("all", "url", "suspicious"):
        url_filter = {"user_id": user_id}
        if scan_type == "suspicious":
            url_filter["scan_type"] = "suspicious"
        elif scan_type == "url":
            url_filter["scan_type"] = {"$in": ["standard", "batch"]}

        if search:
            url_filter["submitted_url"] = {"$regex": search, "$options": "i"}

        url_cursor = db.url_scans.find(url_filter).sort("created_at", -1)
        for u in url_cursor:
            items.append({
                "id": str(u["_id"]),
                "record_type": "URL",
                "scan_type": u.get("scan_type", "standard"),
                "target": u.get("submitted_url"),
                "final_url": u.get("final_url"),
                "status": u.get("availability_status"),
                "http_status": u.get("http_status"),
                "response_time_ms": u.get("response_time_ms"),
                "reputation": u.get("security_status") or u.get("reputation_status") or "UNKNOWN",
                "created_at": u.get("created_at")
            })

    # APK scans
    if scan_type in ("all", "apk"):
        apk_filter = {"user_id": user_id}
        if search:
            apk_filter["$or"] = [
                {"filename": {"$regex": search, "$options": "i"}},
                {"sha256": {"$regex": search, "$options": "i"}}
            ]

        apk_cursor = db.apk_scans.find(apk_filter).sort("created_at", -1)
        for a in apk_cursor:
            items.append({
                "id": str(a["_id"]),
                "record_type": "APK",
                "scan_type": "apk",
                "target": a.get("filename"),
                "sha256": a.get("sha256"),
                "status": a.get("overall_status"),
                "reputation": a.get("reputation_status"),
                "package_name": a.get("metadata", {}).get("package_name"),
                "created_at": a.get("created_at")
            })

    # Sort combined items by creation time descending
    items.sort(key=lambda x: x.get("created_at") or 0, reverse=True)
    total_count = len(items)
    paginated_items = items[skip : skip + limit]

    return jsonify({
        "total": total_count,
        "page": page,
        "limit": limit,
        "items": paginated_items
    }), 200

@history_bp.route("/url/<scan_id>", methods=["GET"])
@auth_required
def get_url_scan_detail(scan_id: str):
    user_id = g.current_user["_id"]
    db = get_db()
    try:
        scan = db.url_scans.find_one({"_id": ObjectId(scan_id), "user_id": user_id})
    except Exception:
        scan = None

    if not scan:
        return jsonify({"message": "URL scan report not found or access denied."}), 404

    scan["_id"] = str(scan["_id"])
    return jsonify({"scan": scan}), 200

@history_bp.route("/apk/<scan_id>", methods=["GET"])
@auth_required
def get_apk_scan_detail(scan_id: str):
    user_id = g.current_user["_id"]
    db = get_db()
    try:
        scan = db.apk_scans.find_one({"_id": ObjectId(scan_id), "user_id": user_id})
    except Exception:
        scan = None

    if not scan:
        return jsonify({"message": "APK scan report not found or access denied."}), 404

    scan["_id"] = str(scan["_id"])

    # Fetch associated embedded URLs
    embedded_cursor = db.embedded_urls.find({"apk_scan_id": scan_id})
    scan["embedded_urls"] = []
    for doc in embedded_cursor:
        doc["_id"] = str(doc["_id"])
        scan["embedded_urls"].append(doc)

    return jsonify({"scan": scan}), 200

@history_bp.route("/url/<scan_id>", methods=["DELETE"])
@auth_required
def delete_url_scan(scan_id: str):
    user_id = g.current_user["_id"]
    db = get_db()
    try:
        result = db.url_scans.delete_one({"_id": ObjectId(scan_id), "user_id": user_id})
    except Exception:
        result = None

    if not result or result.deleted_count == 0:
        return jsonify({"message": "Scan not found or access denied."}), 404

    return jsonify({"message": "Scan report deleted successfully."}), 200

@history_bp.route("/apk/<scan_id>", methods=["DELETE"])
@auth_required
def delete_apk_scan(scan_id: str):
    user_id = g.current_user["_id"]
    db = get_db()
    try:
        result = db.apk_scans.delete_one({"_id": ObjectId(scan_id), "user_id": user_id})
        if result and result.deleted_count > 0:
            db.embedded_urls.delete_many({"apk_scan_id": scan_id})
    except Exception:
        result = None

    if not result or result.deleted_count == 0:
        return jsonify({"message": "APK scan not found or access denied."}), 404

    return jsonify({"message": "APK scan and extracted URLs deleted successfully."}), 200

@history_bp.route("/clear", methods=["DELETE"])
@auth_required
def clear_history():
    user_id = g.current_user["_id"]
    db = get_db()
    db.url_scans.delete_many({"user_id": user_id})
    db.apk_scans.delete_many({"user_id": user_id})
    db.embedded_urls.delete_many({"user_id": user_id})

    return jsonify({"message": "Scan history cleared successfully."}), 200
