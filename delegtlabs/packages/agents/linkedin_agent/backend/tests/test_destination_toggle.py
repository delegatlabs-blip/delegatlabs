"""AC: PATCH toggle persistence + IDOR → 404 (C-linkedin-destinations §3.7)."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException


@pytest.mark.asyncio
async def test_patch_destination_enabled_persists(tenant_a, dest_personal):
    from app.services.linkedin_destinations import patch_destination_enabled

    updated = {**dest_personal, "is_enabled": False}
    with patch(
        "app.services.linkedin_destinations.execute_one_raw",
        new_callable=AsyncMock,
        return_value=updated,
    ) as mock_exec:
        row = await patch_destination_enabled(
            tenant_a, str(dest_personal["id"]), False
        )

    assert row["is_enabled"] is False
    mock_exec.assert_awaited_once()
    sql, params = mock_exec.await_args.args[0], mock_exec.await_args.args[1]
    assert "is_enabled" in sql.lower() or "enabled" in str(params)
    assert params["tid"] == tenant_a
    assert params["id"] == str(dest_personal["id"])
    assert params["enabled"] is False


@pytest.mark.asyncio
async def test_patch_destination_idor_other_tenant_404(tenant_b, dest_personal):
    """Destination id belonging to another tenant (or missing) → 404, not leak."""
    from app.services.linkedin_destinations import patch_destination_enabled

    with patch(
        "app.services.linkedin_destinations.execute_one_raw",
        new_callable=AsyncMock,
        return_value=None,
    ):
        with pytest.raises(HTTPException) as exc_info:
            await patch_destination_enabled(
                tenant_b, str(dest_personal["id"]), True
            )

    assert exc_info.value.status_code == 404
    assert "not found" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_patch_destination_archived_or_missing_404(tenant_a):
    from app.services.linkedin_destinations import patch_destination_enabled

    with patch(
        "app.services.linkedin_destinations.execute_one_raw",
        new_callable=AsyncMock,
        return_value=None,
    ):
        with pytest.raises(HTTPException) as exc_info:
            await patch_destination_enabled(
                tenant_a, "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", True
            )

    assert exc_info.value.status_code == 404
