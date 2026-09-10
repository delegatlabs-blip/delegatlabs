"""Admin user management must stay separately addressable from workspace billing."""
from unittest.mock import AsyncMock, patch

import pytest
from app.api.auth_context import AuthContext
from app.api.endpoints import admin
from tests.ts8_helpers import route_table


def test_admin_user_list_and_status_routes_are_mounted(api_app):
    routes = route_table(api_app)
    assert ("GET", "/admin/users") in routes
    assert ("PATCH", "/admin/users/{user_id}") in routes


@pytest.mark.asyncio
async def test_suspending_a_user_revokes_their_live_sessions():
    class Request:
        async def json(self):
            return {"status": "suspended"}

    before = {"id": "user-1", "email": "person@example.com", "status": "active"}
    updated = {**before, "status": "suspended"}
    with (
        patch.object(admin, "execute_one_raw", new=AsyncMock(side_effect=[before, updated])),
        patch.object(admin, "execute_raw", new=AsyncMock()) as raw,
        patch.object(admin, "write_audit_log", new=AsyncMock()),
    ):
        result = await admin.update_user_status(
            "user-1", Request(), AuthContext(user_id="staff-1", staff_role="tech")
        )

    assert result["status"] == "suspended"
    assert "UPDATE user_sessions SET revoked_at" in raw.await_args.args[0]
