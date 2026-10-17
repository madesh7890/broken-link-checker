import pymongo
from pymongo import MongoClient, ASCENDING, DESCENDING, IndexModel
from config import Config

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is None:
        _client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000, maxPoolSize=5)
        _db = _client.get_default_database()
        init_indexes(_db)
    return _db

def init_indexes(db):
    # One request per collection (create_indexes) instead of one per index -> faster cold start
    try:
        db.users.create_indexes([
            IndexModel([("username", ASCENDING)], unique=True),
            IndexModel([("email", ASCENDING)], unique=True),
        ])
        db.url_scans.create_indexes([
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("submitted_url", ASCENDING)]),
        ])
        db.apk_scans.create_indexes([
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("sha256", ASCENDING)]),
        ])
        db.embedded_urls.create_indexes([
            IndexModel([("apk_scan_id", ASCENDING)]),
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("url", ASCENDING)]),
        ])
        db.password_resets.create_indexes([
            IndexModel([("email", ASCENDING)]),
            IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0),
        ])
        db.upload_chunks.create_indexes([
            IndexModel([("upload_id", ASCENDING), ("user_id", ASCENDING), ("index", ASCENDING)], unique=True),
            IndexModel([("created_at", ASCENDING)], expireAfterSeconds=3600),
        ])
        db.reputation_cache.create_indexes([
            IndexModel([("query_key", ASCENDING)], unique=True),
            IndexModel([("cached_at", ASCENDING)], expireAfterSeconds=86400),
        ])
    except Exception as e:
        print(f"Warning: MongoDB index initialization failed: {e}")

def check_db_health():
    try:
        db = get_db()
        db.command('ping')
        return {"status": "connected", "database": db.name}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}
