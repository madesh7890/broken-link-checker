import pytest
import os
import io
import zipfile
import json
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from services.ssrf_guard import is_ip_private_or_restricted, validate_url_safe
from services.url_checker import classify_availability, check_single_url
from services.reputation_service import ReputationService

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert "status" in data
    assert data["service"] == "Broken Link Checker & Security Analyzer API"

def test_integration_status(client):
    response = client.get("/api/integrations/status")
    assert response.status_code == 200
    data = response.get_json()
    assert "integrations" in data
    assert "google_safe_browsing" in data["integrations"]
    assert "virustotal" in data["integrations"]
    assert data["offline_fallback_active"] is True

def test_ssrf_guard_blocks_private_and_loopback():
    blocked, reason = is_ip_private_or_restricted("127.0.0.1")
    assert blocked is True
    assert "Loopback" in reason

    blocked, reason = is_ip_private_or_restricted("10.0.0.1")
    assert blocked is True
    assert "Private" in reason

    blocked, reason = is_ip_private_or_restricted("192.168.1.1")
    assert blocked is True
    assert "Private" in reason

    blocked, reason = is_ip_private_or_restricted("169.254.169.254")
    assert blocked is True

    blocked, reason = is_ip_private_or_restricted("8.8.8.8")
    assert blocked is False

def test_ssrf_url_validation_blocks_localhost():
    is_safe, error, _ = validate_url_safe("http://localhost:8080/admin")
    assert is_safe is False
    assert "internal hostname" in error or "restricted" in error

    is_safe, error, _ = validate_url_safe("http://127.0.0.1/sensitive")
    assert is_safe is False
    assert "Security Block (SSRF)" in error

def test_availability_classification():
    assert classify_availability(200, False, None) == "WORKING"
    assert classify_availability(200, True, None) == "REDIRECTED"
    assert classify_availability(301, False, None) == "WORKING"
    assert classify_availability(401, False, None) == "ACCESS_RESTRICTED"
    assert classify_availability(403, False, None) == "ACCESS_RESTRICTED"
    assert classify_availability(404, False, None) == "BROKEN"
    assert classify_availability(410, False, None) == "BROKEN"
    assert classify_availability(500, False, None) == "SERVER_ERROR"
    assert classify_availability(None, False, "DNS resolution failed") == "CONNECTION_FAILED"
    assert classify_availability(None, False, "SSRF Blocked") == "ACCESS_RESTRICTED"

def test_offline_reputation_fallback():
    rep = ReputationService.check_url_reputation("https://example.com")
    assert rep["status"] in ("UNKNOWN", "SAFE")
    assert "reason" in rep

    hash_rep = ReputationService.check_apk_hash_reputation("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    assert hash_rep["status"] == "UNKNOWN"
    assert "External malware hash reputation checking is not configured" in hash_rep["reason"]

def test_auth_validation_and_flow(client):
    unique_suffix = os.urandom(4).hex()
    username = f"tester_{unique_suffix}"
    email = f"tester_{unique_suffix}@example.com"

    # Register
    reg_res = client.post("/api/auth/register", json={
        "username": username,
        "display_name": "Test User",
        "email": email,
        "password": "Password123!",
        "password_confirm": "Password123!"
    })
    assert reg_res.status_code == 201
    data = reg_res.get_json()
    assert "token" in data
    token = data["token"]

    # Prevent duplicate
    dup_res = client.post("/api/auth/register", json={
        "username": username,
        "display_name": "Test User",
        "email": email,
        "password": "Password123!",
        "password_confirm": "Password123!"
    })
    assert dup_res.status_code == 409

    # Login with username
    login_res = client.post("/api/auth/login", json={
        "identifier": username,
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    assert "token" in login_res.get_json()

    # Protected endpoint with valid token
    headers = {"Authorization": f"Bearer {token}"}
    profile_res = client.get("/api/profile", headers=headers)
    assert profile_res.status_code == 200
    assert profile_res.get_json()["user"]["username"] == username

    # Update profile
    upd_res = client.put("/api/profile", headers=headers, json={
        "display_name": "Updated Test User",
        "avatar": "terminal"
    })
    assert upd_res.status_code == 200
    assert upd_res.get_json()["user"]["display_name"] == "Updated Test User"

    # Password change
    pwd_res = client.put("/api/profile/password", headers=headers, json={
        "current_password": "Password123!",
        "new_password": "NewPassword456!",
        "confirm_password": "NewPassword456!"
    })
    assert pwd_res.status_code == 200

    # Verify old password no longer works
    fail_login = client.post("/api/auth/login", json={
        "identifier": username,
        "password": "Password123!"
    })
    assert fail_login.status_code == 401

    # Verify new password works
    succ_login = client.post("/api/auth/login", json={
        "identifier": username,
        "password": "NewPassword456!"
    })
    assert succ_login.status_code == 200

def test_url_checker_and_ssrf_blocking(client):
    unique_suffix = os.urandom(4).hex()
    reg_res = client.post("/api/auth/register", json={
        "username": f"user_url_{unique_suffix}",
        "display_name": "URL Tester",
        "email": f"url_{unique_suffix}@test.com",
        "password": "Password123!",
        "password_confirm": "Password123!"
    })
    token = reg_res.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # SSRF blocked test: localhost
    res_local = client.post("/api/links/check-single", headers=headers, json={"url": "http://127.0.0.1:8000/internal"})
    assert res_local.status_code == 200
    scan = res_local.get_json()["scan"]
    assert scan["availability_status"] == "ACCESS_RESTRICTED"
    assert "SSRF" in scan["error"]

    # Suspicious link check
    res_susp = client.post("/api/suspicious/scan", headers=headers, json={"url": "https://example.com/login-verify"})
    assert res_susp.status_code == 200
    susp_scan = res_susp.get_json()["scan"]
    assert susp_scan["security_status"] in ("SAFE", "UNSAFE", "MODERATE", "UNKNOWN", "UNREACHABLE")
    assert "heuristics" in susp_scan

    # Dashboard stats verification
    stats_res = client.get("/api/dashboard/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.get_json()["stats"]
    assert stats["total_urls_scanned"] >= 2
    assert "recent_scans" in stats

    # History retrieval
    hist_res = client.get("/api/history", headers=headers)
    assert hist_res.status_code == 200
    assert len(hist_res.get_json()["items"]) >= 2

def test_apk_upload_validation(client):
    unique_suffix = os.urandom(4).hex()
    reg_res = client.post("/api/auth/register", json={
        "username": f"apkuser_{unique_suffix}",
        "display_name": "APK User",
        "email": f"apk_{unique_suffix}@test.com",
        "password": "Password123!",
        "password_confirm": "Password123!"
    })
    token = reg_res.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload invalid extension
    data = {"file": (io.BytesIO(b"fake data"), "test.exe")}
    res = client.post("/api/apk/scan", headers=headers, data=data, content_type="multipart/form-data")
    assert res.status_code == 400

    # Upload mock APK
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("AndroidManifest.xml", b"<manifest package='com.example.testapp'></manifest>")
        z.writestr("classes.dex", b"data containing https://api.example.com/v1/auth and http://insecure-endpoint.org/ping")
    buf.seek(0)

    data_mock_apk = {"file": (buf, "mock_sample.apk")}
    res_mock = client.post("/api/apk/scan", headers=headers, data=data_mock_apk, content_type="multipart/form-data")
    assert res_mock.status_code == 201
    mock_data = res_mock.get_json()["scan"]
    assert mock_data["sha256"] is not None
    assert mock_data["extracted_urls_count"] >= 2
    assert mock_data["overall_status"] in ("SAFE", "UNSAFE", "INCONCLUSIVE", "POTENTIALLY_RISKY")

    # Fetch embedded URLs
    scan_id = mock_data["_id"]
    emb_res = client.get(f"/api/apk/embedded-urls/{scan_id}", headers=headers)
    assert emb_res.status_code == 200
    assert len(emb_res.get_json()["urls"]) >= 2

def test_nat64_and_ssrf_filtering():
    # Public IPv4 embedded in NAT64 well-known prefix: 212.32.254.35 -> permitted
    blocked, _ = is_ip_private_or_restricted("64:ff9b::d420:fe23")
    assert blocked is False

    # Loopback 127.0.0.1 embedded in NAT64 -> blocked
    blocked, reason = is_ip_private_or_restricted("64:ff9b::7f00:0001")
    assert blocked is True
    assert "Loopback" in reason

    # Private 10.0.0.1 embedded in NAT64 -> blocked
    blocked, reason = is_ip_private_or_restricted("64:ff9b::a00:0001")
    assert blocked is True
    assert "Private" in reason

def test_suspicious_scanner_comprehensive_cases(client):
    unique_suffix = os.urandom(4).hex()
    reg_res = client.post("/api/auth/register", json={
        "username": f"susp_user_{unique_suffix}",
        "display_name": "Suspicious Tester",
        "email": f"susp_{unique_suffix}@test.com",
        "password": "Password123!",
        "password_confirm": "Password123!"
    })
    token = reg_res.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Reserved non-resolving test domain (Never mark malicious solely because unreachable)
    res_unreachable = client.post("/api/suspicious/scan", headers=headers, json={
        "url": "http://secure-login-example.invalid/verify-account"
    })
    assert res_unreachable.status_code == 200
    scan_unreach = res_unreachable.get_json()["scan"]
    assert scan_unreach["risk_level"] in ("URL_UNREACHABLE", "POTENTIALLY_SUSPICIOUS")
    assert scan_unreach["availability_status"] == "CONNECTION_FAILED"

    # 2. SSRF block attempt (localhost) -> 200 with clear HIGH_RISK / UNSAFE verdict
    res_ssrf = client.post("/api/suspicious/scan", headers=headers, json={
        "url": "http://localhost:8080/admin"
    })
    assert res_ssrf.status_code == 200
    scan_ssrf = res_ssrf.get_json()["scan"]
    assert scan_ssrf["security_status"] == "UNSAFE"
    assert scan_ssrf["risk_level"] == "HIGH_RISK"
    assert scan_ssrf["availability_status"] == "ACCESS_RESTRICTED"

    # 3. Suspicious brand spoofing pattern
    res_spoof = client.post("/api/suspicious/scan", headers=headers, json={
        "url": "https://paypal.com.account-update.xyz/login-verify"
    })
    assert res_spoof.status_code == 200
    scan_spoof = res_spoof.get_json()["scan"]
    assert scan_spoof["risk_level"] in ("HIGH_RISK", "POTENTIALLY_SUSPICIOUS")
    assert len(scan_spoof["heuristics"]) >= 1

    # 4. Malformed protocol
    res_bad = client.post("/api/suspicious/scan", headers=headers, json={
        "url": "ftp://malformed-protocol.test/file"
    })
    assert res_bad.status_code == 400

