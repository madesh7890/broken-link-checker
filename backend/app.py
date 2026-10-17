import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.link_checker import link_checker_bp
from routes.suspicious import suspicious_bp
from routes.apk_scanner import apk_bp
from routes.dashboard import dashboard_bp
from routes.history import history_bp
from routes.integration import integration_bp

FRONTEND_DIST = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(link_checker_bp)
    app.register_blueprint(suspicious_bp)
    app.register_blueprint(apk_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(integration_bp)

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad Request", "message": str(e.description if hasattr(e, "description") else e)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Unauthorized", "message": "Authentication required."}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden", "message": "You do not have permission to access this resource."}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not Found", "message": "The requested API endpoint was not found."}), 404

    @app.errorhandler(413)
    def request_entity_too_large(e):
        return jsonify({"error": "File Too Large", "message": "The uploaded payload exceeds the maximum permitted size (50MB)."}), 413

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "Too Many Requests", "message": "Rate limit exceeded. Please try again shortly."}), 429

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred on the server."}), 500

    # ---- Frontend serve (React build) ----
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith("api/"):
            return jsonify({"error": "Not Found", "message": "The requested API endpoint was not found."}), 404
        if path and os.path.isfile(os.path.join(FRONTEND_DIST, path)):
            return send_from_directory(FRONTEND_DIST, path)
        return send_from_directory(FRONTEND_DIST, "index.html")

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)