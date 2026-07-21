from fastapi.testclient import TestClient
from user.main import app

client = TestClient(app)


def test_user_global_dashboard_endpoint():
    response = client.get("/user/api/v1/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "purchased_agents" in data
    assert "aggregate_metrics" in data
    assert data["aggregate_metrics"]["total_leads"] >= 0


def test_linkedin_user_config_endpoints():
    # GET config
    res_get = client.get("/user/api/v1/agents/linkedin-agent/config")
    assert res_get.status_code == 200
    assert "lead_gen" in res_get.json()

    # POST config
    payload = {
        "lead_gen": {
            "target_job_titles": ["CTO", "VP Engineering"],
            "industries": ["Software"],
            "company_size": ["10-50 employees"],
            "connection_message_template": "Hello {{first_name}}!",
            "daily_connection_cap": 15
        },
        "post_gen": {
            "content_pillars": ["Tech Trends"],
            "tone": "Casual",
            "posting_frequency": "daily",
            "approval_mode": "auto_publish"
        }
    }
    res_post = client.post("/user/api/v1/agents/linkedin-agent/config", json=payload)
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "success"

    # Re-fetch config to verify persistence
    res_verify = client.get("/user/api/v1/agents/linkedin-agent/config")
    assert res_verify.status_code == 200
    assert res_verify.json()["lead_gen"]["target_job_titles"] == ["CTO", "VP Engineering"]


def test_linkedin_user_stats_endpoint():
    response = client.get("/user/api/v1/agents/linkedin-agent/stats")
    assert response.status_code == 200
    data = response.json()
    assert "leads" in data
    assert "posts" in data
    assert "best_performing_criteria" in data
