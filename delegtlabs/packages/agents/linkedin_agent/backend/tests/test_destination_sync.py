"""AC: Sync upserts personal + orgs; preserves is_enabled on rematch (C-linkedin-destinations §1)."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest


@pytest.mark.asyncio
async def test_upsert_insert_defaults_personal_on_org_off(tenant_a, person_urn, org_urn):
    """Q-3 B / contract: personal default_enabled=True, organization=False on first insert."""
    from app.services.linkedin_destinations import _upsert_destination

    inserted: list[dict] = []

    async def fake_one(sql: str, params=None):
        if "SELECT" in sql.upper() and "FROM" in sql.upper():
            return None
        if "INSERT" in sql.upper():
            row = {
                "id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
                "tenant_id": params["tid"],
                "author_urn": params["urn"],
                "destination_kind": params["kind"],
                "display_name": params["name"],
                "is_enabled": params["enabled"],
                "can_publish": params["can_publish"],
                "role": params["role"],
                "health": params["health"],
                "last_synced_at": None,
                "archived_at": None,
                "metadata": {},
            }
            inserted.append(row)
            return row
        return None

    with patch(
        "app.services.linkedin_destinations.execute_one_raw",
        side_effect=fake_one,
    ):
        personal = await _upsert_destination(
            tenant_id=tenant_a,
            author_urn=person_urn,
            destination_kind="personal",
            display_name="Alice",
            can_publish=True,
            role=None,
            default_enabled=True,
        )
        org = await _upsert_destination(
            tenant_id=tenant_a,
            author_urn=org_urn,
            destination_kind="organization",
            display_name="Acme",
            can_publish=True,
            role="ADMINISTRATOR",
            default_enabled=False,
        )

    assert personal["is_enabled"] is True
    assert org["is_enabled"] is False
    assert len(inserted) == 2


@pytest.mark.asyncio
async def test_upsert_rematch_preserves_is_enabled(tenant_a, org_urn):
    """Sync rematch must not overwrite is_enabled (contract §1)."""
    from app.services.linkedin_destinations import _upsert_destination

    existing = {
        "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
        "tenant_id": tenant_a,
        "author_urn": org_urn,
        "destination_kind": "organization",
        "display_name": "Acme",
        "is_enabled": True,  # user opted in
        "can_publish": True,
        "role": "ADMINISTRATOR",
        "health": "green",
        "last_synced_at": None,
        "archived_at": None,
    }
    update_params_seen: list[dict] = []

    async def fake_one(sql: str, params=None):
        if "SELECT" in sql.upper():
            return existing
        if "UPDATE" in sql.upper():
            update_params_seen.append(dict(params or {}))
            # RETURNING must keep prior is_enabled (SQL does not SET is_enabled)
            return {**existing, "display_name": params.get("name") or existing["display_name"]}
        return None

    with patch(
        "app.services.linkedin_destinations.execute_one_raw",
        side_effect=fake_one,
    ):
        row = await _upsert_destination(
            tenant_id=tenant_a,
            author_urn=org_urn,
            destination_kind="organization",
            display_name="Acme Renamed",
            can_publish=True,
            role="ADMINISTRATOR",
            default_enabled=False,  # must not apply on rematch
        )

    assert row["is_enabled"] is True
    assert update_params_seen, "expected UPDATE path"
    assert "enabled" not in update_params_seen[0]
    assert "is_enabled" not in update_params_seen[0]


@pytest.mark.asyncio
async def test_sync_destinations_upserts_personal_and_orgs(
    tenant_a, person_urn, org_urn
):
    """sync_destinations discovers personal + ACL orgs (no hard-coded names)."""
    from app.services.linkedin_destinations import sync_destinations

    upsert_calls: list[dict] = []

    async def fake_upsert(**kwargs):
        upsert_calls.append(kwargs)
        return {
            "id": f"id-{kwargs['destination_kind']}",
            "author_urn": kwargs["author_urn"],
            "destination_kind": kwargs["destination_kind"],
            "is_enabled": kwargs["default_enabled"],
            "can_publish": kwargs["can_publish"],
            "display_name": kwargs["display_name"],
            "archived_at": None,
        }

    with (
        patch(
            "app.services.linkedin_destinations.execute_one_raw",
            new_callable=AsyncMock,
            return_value={"id": 1},
        ),
        patch(
            "app.services.linkedin_destinations.execute_raw",
            new_callable=AsyncMock,
            return_value=[],
        ),
        patch(
            "app.services.linkedin_destinations._upsert_destination",
            side_effect=fake_upsert,
        ),
        patch(
            "app.services.linkedin_destinations.fetch_organization_acls",
            new_callable=AsyncMock,
            return_value=(
                [
                    {
                        "author_urn": org_urn,
                        "role": "ADMINISTRATOR",
                        "can_publish": True,
                        "display_name": "Discovered Page",
                    }
                ],
                None,
            ),
        ),
        patch(
            "app.services.linkedin_destinations.soft_archive_missing_orgs",
            new_callable=AsyncMock,
            return_value=0,
        ),
        patch(
            "app.services.linkedin_destinations.list_destinations",
            new_callable=AsyncMock,
            return_value=[{"author_urn": person_urn}, {"author_urn": org_urn}],
        ),
    ):
        result = await sync_destinations(
            tenant_id=tenant_a,
            access_token="mock-token",
            member_urn=person_urn,
            display_name="Alice",
        )

    kinds = [c["destination_kind"] for c in upsert_calls]
    assert kinds == ["personal", "organization"]
    assert upsert_calls[0]["default_enabled"] is True
    assert upsert_calls[1]["default_enabled"] is False
    assert upsert_calls[1]["author_urn"] == org_urn
    assert upsert_calls[1]["display_name"] == "Discovered Page"
    assert result["acl_error"] is None
    assert len(result["destinations"]) == 2
