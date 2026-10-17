import os
import time
import requests
from flask import Blueprint, jsonify, request
from config import Config
from services.db import check_db_health
from services.reputation_service import ReputationService
from middleware.auth_guard import auth_required

integration_bp = Blueprint("integration", __name__, url_prefix="/api")

@integration_bp.route("/health", methods=["GET"])
def health():
    db_health = check_db_health()
    return jsonify({
        "status": "healthy" if db_health.get("status") == "connected" else "degraded",
        "timestamp": time.time(),
        "database": db_health,
        "service": "Broken Link Checker & Security Analyzer API",
        "version": "1.0.0"
    }), 200

@integration_bp.route("/integrations/status", methods=["GET"])
def integration_status():
    statuses = ReputationService.get_integration_statuses()
    return jsonify({
        "integrations": statuses,
        "offline_fallback_active": True,
        "fallback_notice": "External reputation checking is active via Google Safe Browsing." if Config.SAFE_BROWSING_API_KEY else "External reputation checking is currently unavailable if unconfigured. Basic analysis is available; security status remains unknown."
    }), 200

@integration_bp.route("/integrations/keys", methods=["POST"])
@auth_required
def update_api_keys():
    data = request.get_json(silent=True) or {}
    safe_browsing_key = (data.get("safe_browsing_key") or "").strip()
    virustotal_key = (data.get("virustotal_key") or "").strip()

    test_result = {}

    if safe_browsing_key:
        # Validate against Google Safe Browsing Lookup endpoint
        test_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={safe_browsing_key}"
        test_payload = {
            "client": {"clientId": "broken-link-checker", "clientVersion": "1.0.0"},
            "threatInfo": {
                "threatTypes": ["MALWARE"],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": "http://malware.testing.google.test/testing/malware/"}]
            }
        }
        try:
            r = requests.post(test_url, json=test_payload, timeout=7)
            if r.status_code == 200:
                test_result["safe_browsing"] = "Verified & Active"
                Config.SAFE_BROWSING_API_KEY = safe_browsing_key
                os.environ["SAFE_BROWSING_API_KEY"] = safe_browsing_key
            elif r.status_code in (400, 403):
                return jsonify({
                    "message": f"Google Safe Browsing API Key validation failed ({r.status_code}): Invalid or unauthorized key. Check that Safe Browsing APIs are enabled in your Google Cloud Console."
                }), 400
            else:
                Config.SAFE_BROWSING_API_KEY = safe_browsing_key
                os.environ["SAFE_BROWSING_API_KEY"] = safe_browsing_key
                test_result["safe_browsing"] = f"Key saved (Server returned HTTP {r.status_code})"
        except Exception as e:
            Config.SAFE_BROWSING_API_KEY = safe_browsing_key
            os.environ["SAFE_BROWSING_API_KEY"] = safe_browsing_key
            test_result["safe_browsing"] = "Key saved (Network test timed out)"
    elif data.get("clear_safe_browsing"):
        Config.SAFE_BROWSING_API_KEY = ""
        os.environ["SAFE_BROWSING_API_KEY"] = ""

    if virustotal_key:
        # Validate against VirusTotal API v3 (e.g. querying a standard known hash)
        vt_test_url = "https://www.virustotal.com/api/v3/files/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        try:
            vt_resp = requests.get(vt_test_url, headers={"x-apikey": virustotal_key}, timeout=7)
            if vt_resp.status_code == 200:
                test_result["virustotal"] = "Verified & Active"
                Config.VIRUSTOTAL_API_KEY = virustotal_key
                os.environ["VIRUSTOTAL_API_KEY"] = virustotal_key
            elif vt_resp.status_code in (401, 403):
                return jsonify({
                    "message": f"VirusTotal API Key validation failed ({vt_resp.status_code}): Invalid or unauthorized key. Please verify your VirusTotal API key."
                }), 400
            else:
                Config.VIRUSTOTAL_API_KEY = virustotal_key
                os.environ["VIRUSTOTAL_API_KEY"] = virustotal_key
                test_result["virustotal"] = f"Key saved (Server returned HTTP {vt_resp.status_code})"
        except Exception as e:
            Config.VIRUSTOTAL_API_KEY = virustotal_key
            os.environ["VIRUSTOTAL_API_KEY"] = virustotal_key
            test_result["virustotal"] = "Key saved (Network test timed out)"
    elif data.get("clear_virustotal"):
        Config.VIRUSTOTAL_API_KEY = ""
        os.environ["VIRUSTOTAL_API_KEY"] = ""

    # Persist to .env
    env_path = os.path.join(Config.BASE_DIR, ".env")
    try:
        lines = []
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

        updated_sb = False
        updated_vt = False
        new_lines = []
        for line in lines:
            if line.startswith("SAFE_BROWSING_API_KEY="):
                new_lines.append(f"SAFE_BROWSING_API_KEY={Config.SAFE_BROWSING_API_KEY}\n")
                updated_sb = True
            elif line.startswith("VIRUSTOTAL_API_KEY="):
                new_lines.append(f"VIRUSTOTAL_API_KEY={Config.VIRUSTOTAL_API_KEY}\n")
                updated_vt = True
            else:
                new_lines.append(line)

        if not updated_sb:
            new_lines.append(f"SAFE_BROWSING_API_KEY={Config.SAFE_BROWSING_API_KEY}\n")
        if not updated_vt:
            new_lines.append(f"VIRUSTOTAL_API_KEY={Config.VIRUSTOTAL_API_KEY}\n")

        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception as e:
        print(f"Notice: Failed to write to .env: {e}")

    msg_parts = []
    if safe_browsing_key:
        msg_parts.append("Google Safe Browsing API Key activated")
    elif data.get("clear_safe_browsing"):
        msg_parts.append("Google Safe Browsing API Key removed")
    if virustotal_key:
        msg_parts.append("VirusTotal API Key activated")
    elif data.get("clear_virustotal"):
        msg_parts.append("VirusTotal API Key removed")

    final_msg = " & ".join(msg_parts) + "!" if msg_parts else "Configuration saved."

    return jsonify({
        "message": final_msg,
        "integrations": ReputationService.get_integration_statuses(),
        "test_result": test_result
    }), 200
