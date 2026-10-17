import time
import secrets
import re
from flask import Blueprint, request, jsonify, g
from services.db import get_db
from middleware.auth_guard import (
    hash_password,
    check_password,
    generate_token,
    auth_required,
    rate_limit
)
from config import Config

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
USERNAME_REGEX = re.compile(r'^[a-zA-Z0-9_.-]{3,30}$')

@auth_bp.route("/register", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=60)
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    display_name = (data.get("display_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    password_confirm = data.get("password_confirm") or ""

    errors = {}
    if not username:
        errors["username"] = "Username is required."
    elif not USERNAME_REGEX.match(username):
        errors["username"] = "Username must be 3-30 characters and contain only letters, numbers, dots, hyphens, and underscores."

    if not display_name:
        errors["display_name"] = "Display name is required."
    elif len(display_name) > 50:
        errors["display_name"] = "Display name must be at most 50 characters."

    if not email:
        errors["email"] = "Email address is required."
    elif not EMAIL_REGEX.match(email):
        errors["email"] = "Invalid email address format."

    if not password:
        errors["password"] = "Password is required."
    elif len(password) < 8:
        errors["password"] = "Password must be at least 8 characters long."

    if password != password_confirm:
        errors["password_confirm"] = "Password confirmation does not match."

    if errors:
        return jsonify({"errors": errors, "message": "Validation failed."}), 400

    db = get_db()
    # Check duplicate username
    if db.users.find_one({"username": {"$regex": f"^{re.escape(username)}$", "$options": "i"}}):
        return jsonify({"errors": {"username": "Username is already taken."}, "message": "Username already exists."}), 409

    # Check duplicate email
    if db.users.find_one({"email": email}):
        return jsonify({"errors": {"email": "Email is already registered."}, "message": "Email already exists."}), 409

    pwd_hash = hash_password(password)
    user_doc = {
        "username": username,
        "display_name": display_name,
        "email": email,
        "password_hash": pwd_hash,
        "avatar": data.get("avatar") or "shield",
        "role": "user",
        "preferences": {
            "theme": "dark",
            "request_timeout": 8,
            "auto_redirect_check": True,
            "notify_unsafe_links": True
        },
        "created_at": time.time(),
        "updated_at": time.time()
    }

    insert_result = db.users.insert_one(user_doc)
    user_id = str(insert_result.inserted_id)

    token = generate_token(user_id, email, username)
    user_doc["_id"] = user_id
    user_doc.pop("password_hash", None)

    return jsonify({
        "message": "Account created successfully.",
        "token": token,
        "user": user_doc
    }), 201

@auth_bp.route("/login", methods=["POST"])
@rate_limit(max_requests=Config.LOGIN_RATE_LIMIT, window_seconds=60)
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("identifier") or data.get("username") or data.get("email") or "").strip()
    password = data.get("password") or ""

    if not identifier or not password:
        return jsonify({"message": "Please provide your username or email, and password."}), 400

    db = get_db()
    # Allow login with either username or email
    user = db.users.find_one({
        "$or": [
            {"username": {"$regex": f"^{re.escape(identifier)}$", "$options": "i"}},
            {"email": identifier.lower()}
        ]
    })

    if not user or not check_password(password, user.get("password_hash", "")):
        return jsonify({"message": "Invalid username/email or password."}), 401

    user_id = str(user["_id"])
    token = generate_token(user_id, user["email"], user["username"])

    user_data = {
        "_id": user_id,
        "username": user["username"],
        "display_name": user.get("display_name", user["username"]),
        "email": user["email"],
        "avatar": user.get("avatar", "shield"),
        "role": user.get("role", "user"),
        "preferences": user.get("preferences", {}),
        "created_at": user.get("created_at")
    }

    return jsonify({
        "message": "Logged in successfully.",
        "token": token,
        "user": user_data
    }), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out successfully."}), 200

