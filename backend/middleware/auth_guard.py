import time
import functools
import jwt
import bcrypt
from flask import request, jsonify, g
from config import Config
from services.db import get_db
from bson import ObjectId

# Simple thread-safe rate limiter dictionary {ip_or_key: [timestamps]}
_rate_limits = {}

def rate_limit(max_requests=60, window_seconds=60):
    def decorator(f):
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            ip = request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"
            key = f"{f.__name__}:{ip}"
            now = time.time()

            timestamps = _rate_limits.setdefault(key, [])
            # Prune old timestamps
            _rate_limits[key] = [t for t in timestamps if now - t < window_seconds]

            if len(_rate_limits[key]) >= max_requests:
                return jsonify({
                    "error": "Rate limit exceeded. Please wait before making further requests.",
                    "retry_after": int(window_seconds - (now - _rate_limits[key][0]))
                }), 429

            _rate_limits[key].append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def check_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def generate_token(user_id: str, email: str, username: str) -> str:
    now = time.time()
    payload = {
        "sub": str(user_id),
        "email": email,
        "username": username,
        "iat": int(now),
        "exp": int(now + Config.JWT_ACCESS_TOKEN_EXPIRES.total_seconds())
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def auth_required(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = None
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

        if not token:
            return jsonify({"error": "Authentication token missing."}), 401

        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired authentication token."}), 401

        user_id = payload.get("sub")
        db = get_db()
        try:
            user = db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = None

        if not user:
            return jsonify({"error": "User account no longer exists."}), 401

        # Attach to request context
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        g.current_user = user

        return f(*args, **kwargs)
    return wrapper

def optional_auth(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        g.current_user = None
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            payload = decode_token(token)
            if payload:
                user_id = payload.get("sub")
                db = get_db()
                try:
                    user = db.users.find_one({"_id": ObjectId(user_id)})
                    if user:
                        user["_id"] = str(user["_id"])
                        user.pop("password_hash", None)
                        g.current_user = user
                except Exception:
                    pass
        return f(*args, **kwargs)
    return wrapper
