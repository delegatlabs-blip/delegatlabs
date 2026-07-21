from fastapi.testclient import TestClient

from gateway.main import app


client = TestClient(app)


def test_root_exposes_versioned_surfaces():
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["api_version"] == "v1"
    assert "admin" in body["surfaces"]
    assert "user" in body["surfaces"]
    assert "web" in body["surfaces"]


def test_version_endpoint():
    response = client.get("/version")
    assert response.status_code == 200
    body = response.json()
    assert body["app_version"]
    assert body["api_version"] == "v1"
    assert response.headers.get("X-App-Version") == body["app_version"]
    assert response.headers.get("X-API-Version") == body["api_version"]


def test_admin_health():
    response = client.get("/api/admin/health")
    assert response.status_code in (200, 401)


def test_user_profile_me():
    response = client.get("/user/api/v1/profile/me")
    assert response.status_code == 200
    assert "email" in response.json()


def test_web_meta():
    response = client.get("/web/api/v1/public/meta")
    assert response.status_code == 200
    assert response.json()["name"]
