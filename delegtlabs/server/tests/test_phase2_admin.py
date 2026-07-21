from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from admin.main import app

client = TestClient(app)


def test_linkedin_admin_stats_endpoint():
    with patch("admin.main.verify_admin_token", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = {"user_id": "test-admin", "role": "admin"}
        response = client.get(
            "/api/admin/agents/linkedin-agent/stats",
            headers={"Authorization": "Bearer mock-token"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "active_customers" in data
        assert "mrr_attributed" in data
        assert "recent_runs" in data
        assert "daily_metrics_30d" in data
        assert len(data["recent_runs"]) == 20
        assert len(data["daily_metrics_30d"]) == 31
