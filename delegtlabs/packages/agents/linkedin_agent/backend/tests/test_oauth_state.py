"""AC: OAuth state validated; invalid/expired → 400 (C-linkedin-destinations §3.2, §5).

TS-3 (007_user_auth_tenancy) widened the contract to (valid, tenant_id, intent) so the
same authorize callback can serve LinkedIn sign-in as well as workspace connect.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException


@pytest.mark.asyncio
async def test_consume_oauth_state_invalid_returns_false():
    from app.services.linkedin import consume_oauth_state

    with patch(
        "app.services.linkedin.execute_one_raw",
        new_callable=AsyncMock,
        return_value=None,
    ):
        valid, tenant_id, intent = await consume_oauth_state("bogus-or-expired")

    assert valid is False
    assert tenant_id is None
    assert intent == "connect"


@pytest.mark.asyncio
async def test_consume_oauth_state_valid_returns_tenant():
    from app.services.linkedin import consume_oauth_state

    tid = "11111111-1111-1111-1111-111111111111"
    with patch(
        "app.services.linkedin.execute_one_raw",
        new_callable=AsyncMock,
        return_value={"state": "ok", "tenant_id": tid, "intent": "connect"},
    ):
        valid, tenant_id, intent = await consume_oauth_state("ok")

    assert valid is True
    assert tenant_id == tid
    assert intent == "connect"


@pytest.mark.asyncio
async def test_consume_oauth_state_login_intent_has_no_tenant():
    """A sign-in flow has no workspace yet -- one is provisioned after LinkedIn responds."""
    from app.services.linkedin import consume_oauth_state

    with patch(
        "app.services.linkedin.execute_one_raw",
        new_callable=AsyncMock,
        return_value={"state": "ok", "tenant_id": None, "intent": "login"},
    ):
        valid, tenant_id, intent = await consume_oauth_state("ok")

    assert valid is True
    assert tenant_id is None
    assert intent == "login"


@pytest.mark.asyncio
async def test_consume_oauth_state_tolerates_row_without_intent():
    """Rows written before 007 have no intent column value; treat them as connect."""
    from app.services.linkedin import consume_oauth_state

    tid = "11111111-1111-1111-1111-111111111111"
    with patch(
        "app.services.linkedin.execute_one_raw",
        new_callable=AsyncMock,
        return_value={"state": "ok", "tenant_id": tid},
    ):
        valid, tenant_id, intent = await consume_oauth_state("ok")

    assert valid is True
    assert intent == "connect"


@pytest.mark.asyncio
async def test_handle_callback_invalid_state_raises_400_outside_dev():
    """C-linkedin-destinations: invalid OAuth state must not proceed to token exchange."""
    from app.services import linkedin as linkedin_svc

    with (
        patch.object(linkedin_svc.settings, "NODE_ENV", "production"),
        patch(
            "app.services.linkedin.consume_oauth_state",
            new_callable=AsyncMock,
            return_value=(False, None, "connect"),
        ),
        patch("app.services.linkedin.httpx.AsyncClient") as mock_client_cls,
    ):
        with pytest.raises(HTTPException) as exc_info:
            await linkedin_svc.handle_callback(code="x", state="bad")

    assert exc_info.value.status_code == 400
    assert "Invalid or expired OAuth state" in str(exc_info.value.detail)
    mock_client_cls.assert_not_called()
