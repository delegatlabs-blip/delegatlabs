"""Tenant-scoped LinkedIn destination sync, list, toggle, and disconnect."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx
from fastapi import HTTPException

from app.core.database import execute_one_raw, execute_raw
from app.core.security import encrypt
from app.services.linkedin import LINKEDIN_API_BASE, get_linkedin_headers

logger = logging.getLogger(__name__)

PUBLISHABLE_ORG_ROLES = frozenset(
    {"ADMINISTRATOR", "DIRECT_SPONSORED_CONTENT_POSTER", "CONTENT_ADMIN"}
)

DESTINATION_TABLE = "linkedin_connections"


def _iso(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    return str(value)


def serialize_destination(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "destination_kind": row.get("destination_kind") or "personal",
        "author_urn": row.get("author_urn"),
        "display_name": row.get("display_name"),
        "is_enabled": bool(row.get("is_enabled")),
        "can_publish": bool(row.get("can_publish")),
        "role": row.get("role"),
        "health": row.get("health") or "pending",
        "last_synced_at": _iso(row.get("last_synced_at")),
        "archived_at": _iso(row.get("archived_at")),
    }


def serialize_connection(account: Optional[Dict[str, Any]], destinations: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not account:
        return {
            "connected": False,
            "member_urn": None,
            "display_name": None,
            "email": None,
            "expires_at": None,
            "health": "red",
            "last_synced_at": None,
        }
    last_synced = None
    for d in destinations:
        ts = d.get("last_synced_at")
        if ts and (last_synced is None or str(ts) > str(last_synced)):
            last_synced = ts
    expires = account.get("expires_at")
    expired = False
    if expires:
        exp_dt = expires
        if isinstance(exp_dt, str):
            try:
                exp_dt = datetime.fromisoformat(exp_dt.replace("Z", "+00:00"))
            except ValueError:
                exp_dt = None
        if isinstance(exp_dt, datetime):
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            expired = datetime.now(timezone.utc) > exp_dt
    health = "red" if expired or account.get("disconnected_at") else "green"
    return {
        "connected": not expired and not account.get("disconnected_at"),
        "member_urn": account.get("member_urn"),
        "display_name": account.get("display_name"),
        "email": account.get("email"),
        "expires_at": _iso(expires),
        "health": health,
        "last_synced_at": last_synced if isinstance(last_synced, str) else _iso(last_synced),
    }


async def list_destinations(tenant_id: str, *, include_archived: bool = False) -> List[Dict[str, Any]]:
    where = "tenant_id = :tid"
    if not include_archived:
        where += " AND archived_at IS NULL"
    rows = await execute_raw(
        f"""
        SELECT id, tenant_id, author_urn, destination_kind, display_name,
               is_enabled, can_publish, role, health, last_synced_at, archived_at, metadata
        FROM {DESTINATION_TABLE}
        WHERE {where}
        ORDER BY
          CASE WHEN destination_kind = 'personal' THEN 0 ELSE 1 END,
          display_name NULLS LAST,
          updated_at ASC NULLS LAST
        """,
        {"tid": tenant_id},
    )
    return rows or []


async def enabled_publishable_count(tenant_id: str) -> int:
    row = await execute_one_raw(
        f"""
        SELECT COUNT(*) AS cnt
        FROM {DESTINATION_TABLE}
        WHERE tenant_id = :tid
          AND archived_at IS NULL
          AND is_enabled = true
          AND can_publish = true
        """,
        {"tid": tenant_id},
    )
    return int((row or {}).get("cnt") or 0)


async def list_enabled_publishable(tenant_id: str) -> List[Dict[str, Any]]:
    rows = await execute_raw(
        f"""
        SELECT id, tenant_id, author_urn, destination_kind, display_name,
               is_enabled, can_publish, role, health, last_synced_at, archived_at
        FROM {DESTINATION_TABLE}
        WHERE tenant_id = :tid
          AND archived_at IS NULL
          AND is_enabled = true
          AND can_publish = true
        ORDER BY
          CASE WHEN destination_kind = 'personal' THEN 0 ELSE 1 END,
          display_name NULLS LAST
        """,
        {"tid": tenant_id},
    )
    return rows or []


async def patch_destination_enabled(
    tenant_id: str, destination_id: str, is_enabled: bool
) -> Dict[str, Any]:
    row = await execute_one_raw(
        f"""
        UPDATE {DESTINATION_TABLE}
        SET is_enabled = :enabled, updated_at = NOW()
        WHERE id = CAST(:id AS uuid)
          AND tenant_id = :tid
          AND archived_at IS NULL
        RETURNING id, tenant_id, author_urn, destination_kind, display_name,
                  is_enabled, can_publish, role, health, last_synced_at, archived_at, metadata
        """,
        {"id": destination_id, "tid": tenant_id, "enabled": is_enabled},
    )
    if not row:
        raise HTTPException(status_code=404, detail="Destination not found")
    return row


async def soft_archive_all_destinations(tenant_id: str) -> int:
    rows = await execute_raw(
        f"""
        UPDATE {DESTINATION_TABLE}
        SET archived_at = NOW(), updated_at = NOW()
        WHERE tenant_id = :tid AND archived_at IS NULL
        RETURNING id
        """,
        {"tid": tenant_id},
    )
    return len(rows or [])


async def soft_archive_missing_orgs(tenant_id: str, keep_urns: List[str]) -> int:
    keep = set(keep_urns)
    orgs = await execute_raw(
        f"""
        SELECT id, author_urn FROM {DESTINATION_TABLE}
        WHERE tenant_id = :tid
          AND archived_at IS NULL
          AND destination_kind = 'organization'
        """,
        {"tid": tenant_id},
    )
    archived = 0
    for org in orgs or []:
        if org.get("author_urn") in keep:
            continue
        await execute_raw(
            f"""
            UPDATE {DESTINATION_TABLE}
            SET archived_at = NOW(), updated_at = NOW()
            WHERE id = :id
            """,
            {"id": org["id"]},
        )
        archived += 1
    return archived


async def _upsert_destination(
    *,
    tenant_id: str,
    author_urn: str,
    destination_kind: str,
    display_name: Optional[str],
    can_publish: bool,
    role: Optional[str],
    default_enabled: bool,
    health: str = "green",
    linkedin_account_id: Optional[int] = None,
) -> Dict[str, Any]:
    existing = await execute_one_raw(
        f"""
        SELECT *
        FROM {DESTINATION_TABLE}
        WHERE tenant_id = :tid AND author_urn = :urn
        ORDER BY archived_at NULLS FIRST, updated_at DESC NULLS LAST
        LIMIT 1
        """,
        {"tid": tenant_id, "urn": author_urn},
    )
    surface = "personal" if destination_kind == "personal" else "company"
    if existing:
        row = await execute_one_raw(
            f"""
            UPDATE {DESTINATION_TABLE}
            SET destination_kind = CAST(:kind AS destination_kind),
                display_name = COALESCE(:name, display_name),
                can_publish = :can_publish,
                role = :role,
                health = CAST(:health AS connection_health),
                last_synced_at = NOW(),
                archived_at = NULL,
                surface = CAST(:surface AS linkedin_surface),
                linkedin_account_id = COALESCE(:account_id, linkedin_account_id),
                updated_at = NOW()
            WHERE id = :id
            RETURNING id, tenant_id, author_urn, destination_kind, display_name,
                      is_enabled, can_publish, role, health, last_synced_at, archived_at, metadata
            """,
            {
                "id": existing["id"],
                "kind": destination_kind,
                "name": display_name,
                "can_publish": can_publish,
                "role": role,
                "health": health,
                "surface": surface,
                "account_id": linkedin_account_id,
            },
        )
        return row or existing

    row = await execute_one_raw(
        f"""
        INSERT INTO {DESTINATION_TABLE} (
          tenant_id, author_urn, destination_kind, display_name,
          is_enabled, can_publish, role, health, last_synced_at, archived_at,
          surface, metadata, linkedin_account_id
        )
        VALUES (
          :tid, :urn, CAST(:kind AS destination_kind), :name,
          :enabled, :can_publish, :role, CAST(:health AS connection_health),
          NOW(), NULL, CAST(:surface AS linkedin_surface), '{{}}'::jsonb, :account_id
        )
        RETURNING id, tenant_id, author_urn, destination_kind, display_name,
                  is_enabled, can_publish, role, health, last_synced_at, archived_at, metadata
        """,
        {
            "tid": tenant_id,
            "urn": author_urn,
            "kind": destination_kind,
            "name": display_name,
            "enabled": default_enabled,
            "can_publish": can_publish,
            "role": role,
            "health": health,
            "surface": surface,
            "account_id": linkedin_account_id,
        },
    )
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create LinkedIn destination")
    return row


async def fetch_organization_acls(
    access_token: str,
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """Return (org entries, error_message). error set on insufficient scope / 403."""
    headers = get_linkedin_headers(access_token)
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(
                f"{LINKEDIN_API_BASE}/rest/organizationAcls",
                headers=headers,
                params={"q": "roleAssignee"},
            )
            if res.status_code in (401, 403):
                logger.warning(
                    "[LinkedIn] organizationAcls denied status=%s",
                    res.status_code,
                )
                return [], f"LinkedIn organization ACL denied ({res.status_code})"
            if res.status_code >= 400:
                detail = res.text[:300]
                logger.warning(
                    "[LinkedIn] organizationAcls failed status=%s body=%s",
                    res.status_code,
                    detail,
                )
                return [], f"LinkedIn organization ACL error {res.status_code}"

            elements = res.json().get("elements") or []
            orgs: List[Dict[str, Any]] = []
            for el in elements:
                org_urn = el.get("organization") or el.get("organizationalTarget")
                if not org_urn:
                    continue
                role = el.get("role")
                state = (el.get("state") or "APPROVED").upper()
                if state not in ("APPROVED", ""):
                    continue
                can_publish = bool(role) and role in PUBLISHABLE_ORG_ROLES
                display = None
                org_obj = el.get("organization~") or el.get("organizationalTarget~") or {}
                if isinstance(org_obj, dict):
                    display = org_obj.get("localizedName") or org_obj.get("vanityName")
                if not display:
                    display = org_urn.split(":")[-1]
                orgs.append(
                    {
                        "author_urn": org_urn,
                        "role": role,
                        "can_publish": can_publish,
                        "display_name": display,
                    }
                )
            return orgs, None
    except Exception as exc:
        logger.warning("[LinkedIn] organizationAcls exception: %s", exc)
        return [], str(exc)


async def sync_destinations(
    tenant_id: str,
    access_token: str,
    member_urn: str,
    display_name: Optional[str],
) -> Dict[str, Any]:
    """Upsert personal + org destinations; preserve is_enabled on rematch."""
    account = await execute_one_raw(
        """
        SELECT id FROM linkedin_accounts
        WHERE tenant_id = CAST(:tid AS uuid) AND disconnected_at IS NULL
        ORDER BY updated_at DESC NULLS LAST, id DESC
        LIMIT 1
        """,
        {"tid": tenant_id},
    )
    account_id = (account or {}).get("id")

    # Soft-archive legacy seed rows that have no author_urn (pre-sync placeholders).
    await execute_raw(
        f"""
        UPDATE {DESTINATION_TABLE}
        SET archived_at = NOW(), updated_at = NOW()
        WHERE tenant_id = :tid
          AND archived_at IS NULL
          AND author_urn IS NULL
        """,
        {"tid": tenant_id},
    )

    personal = await _upsert_destination(
        tenant_id=tenant_id,
        author_urn=member_urn,
        destination_kind="personal",
        display_name=display_name or member_urn,
        can_publish=True,
        role=None,
        default_enabled=True,
        health="green",
        linkedin_account_id=account_id,
    )

    orgs, acl_error = await fetch_organization_acls(access_token)
    if acl_error:
        await execute_raw(
            f"""
            UPDATE {DESTINATION_TABLE}
            SET can_publish = false, last_synced_at = NOW(), updated_at = NOW()
            WHERE tenant_id = :tid
              AND archived_at IS NULL
              AND destination_kind = 'organization'
            """,
            {"tid": tenant_id},
        )
    else:
        keep_urns: List[str] = []
        for org in orgs:
            await _upsert_destination(
                tenant_id=tenant_id,
                author_urn=org["author_urn"],
                destination_kind="organization",
                display_name=org.get("display_name"),
                can_publish=bool(org.get("can_publish")),
                role=org.get("role"),
                default_enabled=False,
                health="green" if org.get("can_publish") else "yellow",
                linkedin_account_id=account_id,
            )
            keep_urns.append(org["author_urn"])
        await soft_archive_missing_orgs(tenant_id, keep_urns)

    await execute_raw(
        """
        UPDATE linkedin_accounts
        SET last_synced_at = NOW(), updated_at = NOW()
        WHERE tenant_id = CAST(:tid AS uuid) AND disconnected_at IS NULL
        """,
        {"tid": tenant_id},
    )

    destinations = await list_destinations(tenant_id)
    return {
        "personal": personal,
        "destinations": destinations,
        "acl_error": acl_error,
        "synced_at": datetime.now(timezone.utc).isoformat(),
    }


async def disconnect_linkedin(tenant_id: str) -> Dict[str, Any]:
    """Soft-disconnect account and soft-archive all destinations for tenant."""
    revoked = encrypt("REVOKED")
    await execute_raw(
        """
        UPDATE linkedin_accounts
        SET access_token_enc = :token,
            disconnected_at = NOW(),
            updated_at = NOW()
        WHERE tenant_id = :tid
          AND disconnected_at IS NULL
        """,
        {"tid": tenant_id, "token": revoked},
    )
    archived = await soft_archive_all_destinations(tenant_id)
    return {
        "ok": True,
        "tenant_id": tenant_id,
        "archived_destinations": archived,
    }


async def linkedin_section_payload(
    tenant_id: str,
    *,
    account: Optional[Dict[str, Any]] = None,
    synced_at: Optional[str] = None,
) -> Dict[str, Any]:
    from app.services.linkedin import get_stored_account

    acct = account if account is not None else await get_stored_account(tenant_id)
    dests = await list_destinations(tenant_id)
    payload: Dict[str, Any] = {
        "connection": serialize_connection(acct, dests),
        "destinations": [serialize_destination(d) for d in dests],
    }
    if synced_at:
        payload["synced_at"] = synced_at
    return payload
