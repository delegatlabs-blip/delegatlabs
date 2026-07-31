from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_public_checkout_catalog_endpoint():
    response = client.get("/web/api/v1/public/checkout/catalog")
    assert response.status_code == 200
    data = response.json()
    assert "plans" in data
    assert "agents" in data
    assert len(data["agents"]) >= 5


def test_checkout_session_creation():
    payload = {
        "plan_id": "plan_growth",
        "agent_slugs": ["linkedin-agent"],
        "email": "buyer@example.com",
    }
    response = client.post("/web/api/v1/public/checkout/session", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "checkout_url" in data


def test_stripe_webhook_completion():
    payload = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "customer_email": "buyer@example.com",
                "metadata": {"agents": "linkedin-agent"},
            }
        },
    }
    response = client.post(
        "/web/api/v1/public/checkout/webhook",
        json=payload,
        headers={"Stripe-Signature": "t=123,v1=mock_signature"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["received"] is True
    assert "client_id" in data
