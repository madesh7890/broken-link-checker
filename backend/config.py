import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "broken-link-checker-super-secure-dev-secret-key-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-token-secret-broken-link-checker-key-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_EXPIRE_HOURS", "24")))

    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/broken_link_checker")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "broken_link_checker")

    # Uploads
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER") or ("/tmp/uploads" if (os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME") or not os.access(BASE_DIR, os.W_OK)) else os.path.join(BASE_DIR, "uploads"))
    MAX_CONTENT_LENGTH = 55 * 1024 * 1024  # 55 MB headroom for 50 MB files
    ALLOWED_APK_EXTENSIONS = {".apk"}

    # Security & Reputation APIs
    SAFE_BROWSING_API_KEY = os.getenv("SAFE_BROWSING_API_KEY", "")
    VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")

    # Network timeouts & limits
    URL_REQUEST_TIMEOUT = int(os.getenv("URL_REQUEST_TIMEOUT", "8"))
    MAX_REDIRECTS = int(os.getenv("MAX_REDIRECTS", "5"))
    MAX_CONCURRENT_CHECKS = int(os.getenv("MAX_CONCURRENT_CHECKS", "10"))
    USER_AGENT = "BrokenLinkCheckerBot/1.0 (+https://github.com/security/link-checker)"

    # Rate limits (requests per minute per IP or user)
    LOGIN_RATE_LIMIT = int(os.getenv("LOGIN_RATE_LIMIT", "10")) # 10 per min
    SCAN_RATE_LIMIT = int(os.getenv("SCAN_RATE_LIMIT", "60")) # 60 per min
