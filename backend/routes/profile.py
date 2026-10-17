import time
from flask import Blueprint, request, jsonify, g
from services.db import get_db
from middleware.auth_guard import auth_required, hash_password, check_password
from bson import ObjectId

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")

@profile_bp.route("", methods=["GET"])
@auth_required
def get_profile():
    return jsonify({"user": g.current_user}), 200

@profile_bp.route("", methods=["PUT"])
@auth_required
def update_profile():
    data = request.get_json(silent=True) or {}
    display_name = (data.get("display_name") or "").strip()
    avatar = data.get("avatar")
    preferences = data.get("preferences")

    update_fields = {"updated_at": time.time()}
    if display_name:
        if len(display_name) > 50:
            return jsonify({"message": "Display name cannot exceed 50 characters."}), 400
        update_fields["display_name"] = display_name

    if avatar:
        update_fields["avatar"] = str(avatar)[:50]

    if isinstance(preferences, dict):
        update_fields["preferences"] = preferences

    db = get_db()
    db.users.update_one(
        {"_id": ObjectId(g.current_user["_id"])},
        {"$set": update_fields}
    )

    # Fetch updated user
    updated_user = db.users.find_one({"_id": ObjectId(g.current_user["_id"])})
    updated_user["_id"] = str(updated_user["_id"])
    updated_user.pop("password_hash", None)

    return jsonify({"message": "Profile updated successfully.", "user": updated_user}), 200

@profile_bp.route("/password", methods=["PUT"])
@auth_required
def update_password():
    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""
    confirm_password = data.get("confirm_password") or ""

    if not current_password or not new_password:
        return jsonify({"message": "Current and new password are required."}), 400

    if len(new_password) < 8:
        return jsonify({"message": "New password must be at least 8 characters long."}), 400

    if new_password != confirm_password:
        return jsonify({"message": "New passwords do not match."}), 400

    db = get_db()
    user = db.users.find_one({"_id": ObjectId(g.current_user["_id"])})
    if not user or not check_password(current_password, user.get("password_hash", "")):
        return jsonify({"message": "Current password is incorrect."}), 400

    db.users.update_one(
        {"_id": ObjectId(g.current_user["_id"])},
        {"$set": {"password_hash": hash_password(new_password), "updated_at": time.time()}}
    )

    return jsonify({"message": "Password changed successfully."}), 200
