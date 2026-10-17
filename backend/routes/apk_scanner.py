import os
import re
import time
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from werkzeug.utils import secure_filename
from services.db import get_db
from services.apk_analyzer import APKAnalyzer
from services.url_checker import check_single_url
from services.reputation_service import ReputationService
from middleware.auth_guard import auth_required, rate_limit
from config import Config
from bson import ObjectId
from bson.binary import Binary

apk_bp = Blueprint("apk", __name__, url_prefix="/api/apk")

os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

CHUNK_MAX_BYTES = int(4.5 * 1024 * 1024)   # Edge router body limit
MAX_CHUNKS = 35                             # 35 x 2.5 MB = up to ~87.5 MB (supports 50MB files safely)
UPLOAD_ID_RE = re.compile(r"^[a-f0-9]{32}$")


def _analyze_and_save(temp_path: str, original_filename: str, file_size: int):
    """Run static analysis on a staged APK and store results in MongoDB."""
    analysis_result = APKAnalyzer.analyze(temp_path, original_filename)

    db = get_db()
    now = time.time()

    # 1. Insert APK scan record with detailed threat analysis
    apk_doc = {
        "user_id": g.current_user["_id"],
        "filename": original_filename,
        "file_size": file_size,
        "sha256": analysis_result["sha256"],
        "metadata": analysis_result["metadata"],
        "app_category": analysis_result.get("app_category", "General Application"),
        "app_type": analysis_result.get("app_type", "GENERAL"),
        "threat_score": analysis_result.get("threat_score", 5),
        "threat_level": analysis_result.get("threat_level", "SAFE"),
        "verdict_title": analysis_result.get("verdict_title", ""),
        "verdict_summary": analysis_result["verdict_summary"],
        "threats_count": analysis_result.get("threats_count", 0),
        "threats_detected": analysis_result.get("threats_detected", []),
        "cleartext_urls_count": analysis_result.get("cleartext_urls_count", 0),
        "ip_urls_count": analysis_result.get("ip_urls_count", 0),
        "permissions": analysis_result["permissions"],
        "extracted_urls_count": analysis_result["extracted_urls_count"],
        "reputation_status": analysis_result["reputation_status"],
        "reputation_details": analysis_result["reputation_details"],
        "overall_status": analysis_result["overall_status"],
        "security_verdict": analysis_result.get("security_verdict", "SAFE"),
        "static_analysis_disclaimer": analysis_result["static_analysis_disclaimer"],
        "created_at": now
    }

    apk_res = db.apk_scans.insert_one(apk_doc)
    apk_scan_id = str(apk_res.inserted_id)
    apk_doc["_id"] = apk_scan_id

    # 2. Insert embedded URLs (ONE bulk call capped to 150 to keep DB fast)
    embedded_docs = []
    raw_extracted = analysis_result.get("extracted_urls", [])[:150]
    for item in raw_extracted:
        embedded_docs.append({
            "apk_scan_id": apk_scan_id,
            "user_id": g.current_user["_id"],
            "url": item["url"],
            "source_file": item["source_file"],
            "reputation_status": "UNKNOWN",
            "http_status": None,
            "availability_status": "UNCHECKED",
            "error": None,
            "created_at": now
        })
    if embedded_docs:
        try:
            db.embedded_urls.insert_many(embedded_docs, ordered=False)
            for doc in embedded_docs:
                doc["_id"] = str(doc["_id"])
        except Exception:
            pass

    # Return top 50 in initial scan object to keep payload lightweight
    apk_doc["embedded_urls"] = embedded_docs[:50]

    return jsonify({
        "message": "APK static analysis completed successfully.",
        "scan": apk_doc
    }), 201


@apk_bp.route("/scan", methods=["POST"])
@auth_required
@rate_limit(max_requests=10, window_seconds=60)
def scan_apk():
    """Single-request upload (small files)."""
    if "file" not in request.files:
        return jsonify({"message": "No APK file uploaded. Please select an .apk file."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "No file selected."}), 400

    original_filename = secure_filename(file.filename)
    ext = os.path.splitext(original_filename)[1].lower()

    if ext not in Config.ALLOWED_APK_EXTENSIONS:
        return jsonify({"message": "Invalid file type. Only Android APK (.apk) packages are supported."}), 400

    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    temp_filename = f"{uuid.uuid4().hex}_{original_filename}"
    temp_path = os.path.join(Config.UPLOAD_FOLDER, temp_filename)

    try:
        file.save(temp_path)
        file_size = os.path.getsize(temp_path)
        if file_size > Config.MAX_CONTENT_LENGTH:
            return jsonify({"message": f"File exceeds maximum allowed size of {Config.MAX_CONTENT_LENGTH // (1024*1024)}MB."}), 400
        return _analyze_and_save(temp_path, original_filename, file_size)

    except ValueError as ve:
        return jsonify({"message": str(ve)}), 400
    except Exception as e:
        return jsonify({"message": f"An error occurred during APK analysis: {str(e)}"}), 500
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@apk_bp.route("/upload-chunk", methods=["POST"])
@auth_required
@rate_limit(max_requests=200, window_seconds=60)
def upload_chunk():
    """Receive one piece (<= 3.5 MB) of a big APK and park it in MongoDB."""
    upload_id = request.form.get("upload_id", "")
    try:
        index = int(request.form.get("index", ""))
        total = int(request.form.get("total", ""))
    except ValueError:
        return jsonify({"message": "Invalid chunk information."}), 400

    if not UPLOAD_ID_RE.match(upload_id) or total < 1 or total > MAX_CHUNKS or index < 0 or index >= total:
        return jsonify({"message": "Invalid chunk information."}), 400

    chunk = request.files.get("chunk")
    if chunk is None:
        return jsonify({"message": "No chunk data received."}), 400

    data = chunk.read()
    if not data or len(data) > CHUNK_MAX_BYTES:
        return jsonify({"message": "Chunk is empty or too large."}), 400

    db = get_db()
    db.upload_chunks.update_one(
        {"upload_id": upload_id, "user_id": g.current_user["_id"], "index": index},
        {"$set": {"data": Binary(data), "created_at": datetime.utcnow()}},
        upsert=True
    )
    return jsonify({"ok": True, "index": index}), 200


@apk_bp.route("/scan-chunked", methods=["POST"])
@auth_required
@rate_limit(max_requests=10, window_seconds=60)
def scan_apk_chunked():
    """Join all uploaded chunks into one APK file, then analyze it."""
    body = request.get_json(silent=True) or {}
    upload_id = body.get("upload_id", "")
    original_filename = secure_filename(body.get("filename") or "")
    try:
        total = int(body.get("total"))
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid upload information."}), 400

    if not UPLOAD_ID_RE.match(upload_id) or total < 1 or total > MAX_CHUNKS:
        return jsonify({"message": "Invalid upload information."}), 400

    ext = os.path.splitext(original_filename)[1].lower()
    if ext not in Config.ALLOWED_APK_EXTENSIONS:
        return jsonify({"message": "Invalid file type. Only Android APK (.apk) packages are supported."}), 400

    db = get_db()
    query = {"upload_id": upload_id, "user_id": g.current_user["_id"]}
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    temp_path = os.path.join(Config.UPLOAD_FOLDER, f"{uuid.uuid4().hex}_{original_filename}")

    try:
        if db.upload_chunks.count_documents(query) != total:
            return jsonify({"message": "Upload incomplete. Please try uploading the APK again."}), 400

        with open(temp_path, "wb") as out:
            for doc in db.upload_chunks.find(query).sort("index", 1):
                out.write(bytes(doc["data"]))

        file_size = os.path.getsize(temp_path)
        if file_size > Config.MAX_CONTENT_LENGTH:
            return jsonify({"message": f"File exceeds maximum allowed size of {Config.MAX_CONTENT_LENGTH // (1024*1024)}MB."}), 400

        return _analyze_and_save(temp_path, original_filename, file_size)

    except ValueError as ve:
        return jsonify({"message": str(ve)}), 400
    except Exception as e:
        return jsonify({"message": f"An error occurred during APK analysis: {str(e)}"}), 500
    finally:
        try:
            db.upload_chunks.delete_many(query)
        except Exception:
            pass
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@apk_bp.route("/embedded-urls/<scan_id>", methods=["GET"])
@auth_required
def get_embedded_urls(scan_id: str):
    db = get_db()
    # Ensure user owns this scan
    try:
        apk_scan = db.apk_scans.find_one({"_id": ObjectId(scan_id), "user_id": g.current_user["_id"]})
    except Exception:
        apk_scan = None

    if not apk_scan:
        return jsonify({"message": "APK scan not found or access denied."}), 404

    cursor = db.embedded_urls.find({"apk_scan_id": scan_id})
    urls = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        urls.append(doc)

    return jsonify({
        "apk_scan_id": scan_id,
        "filename": apk_scan.get("filename"),
        "sha256": apk_scan.get("sha256"),
        "total_urls": len(urls),
        "urls": urls
    }), 200

@apk_bp.route("/embedded-urls/<scan_id>/check", methods=["POST"])
@auth_required
@rate_limit(max_requests=10, window_seconds=60)
def check_embedded_url(scan_id: str):
    data = request.get_json(silent=True) or {}
    url_id = data.get("url_id")

    db = get_db()
    try:
        embedded_doc = db.embedded_urls.find_one({"_id": ObjectId(url_id), "user_id": g.current_user["_id"]})
    except Exception:
        embedded_doc = None

    if not embedded_doc:
        return jsonify({"message": "Embedded URL record not found."}), 404

    target_url = embedded_doc["url"]
    http_result = check_single_url(target_url)
    rep_result = ReputationService.check_url_reputation(target_url)

    update_fields = {
        "http_status": http_result.get("http_status"),
        "availability_status": http_result.get("availability_status"),
        "reputation_status": rep_result.get("status", "UNKNOWN"),
        "error": http_result.get("error"),
        "last_checked_at": time.time()
    }

    db.embedded_urls.update_one(
        {"_id": ObjectId(url_id)},
        {"$set": update_fields}
    )

    embedded_doc.update(update_fields)
    embedded_doc["_id"] = str(embedded_doc["_id"])

    return jsonify({
        "message": "URL verification completed.",
        "url_data": embedded_doc
    }), 200
