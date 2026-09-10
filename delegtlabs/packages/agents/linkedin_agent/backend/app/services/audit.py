"""Shared helpers: audit logging and RLS session context."""
from __future__ import annotations

import json
from typing import Any, Optional
from contextlib import asynccontextmanager

from sqlalchemy import text
from app.core.database import AsyncSessionLocal, execute_raw, execute_one_raw

DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001"


async def write_audit_log(
    *,
    actor_id: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    before_state: Optional[dict] = None,
    after_state: Optional[dict] = None,
    metadata: Optional[dict] = None,
    actor_type: str = "staff",
) -> None:
    """Append-only audit row. Call from every mutating admin/tenant action."""
    await execute_raw(
        """
        INSERT INTO audit_log
          (actor_id, actor_type, action, resource_type, resource_id, tenant_id, before_state, after_state, metadata)
        VALUES
          (:actor_id, :actor_type, :action, :resource_type, :resource_id, :tenant_id,
           CAST(:before_state AS jsonb), CAST(:after_state AS jsonb), CAST(:metadata AS jsonb))
        """,
        {
            "actor_id": actor_id,
            "actor_type": actor_type,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "tenant_id": tenant_id,
            "before_state": json.dumps(before_state, default=str) if before_state is not None else None,
            "after_state": json.dumps(after_state, default=str) if after_state is not None else None,
            "metadata": json.dumps(metadata or {}, default=str),
        },
    )


async def get_staff(user_id: str) -> Optional[dict]:
    return await execute_one_raw(
        "SELECT * FROM platform_staff WHERE user_id = :uid AND is_active = true",
        {"uid": user_id},
    )


async def get_tenant_membership(user_id: str, tenant_id: str = DEFAULT_TENANT_ID) -> Optional[dict]:
    return await execute_one_raw(
        "SELECT * FROM tenant_members WHERE user_id = :uid AND tenant_id = :tid",
        {"uid": user_id, "tid": tenant_id},
    )


@asynccontextmanager
async def rls_session(
    *,
    user_id: str,
    tenant_id: Optional[str] = None,
    is_platform_staff: bool = False,
    staff_role: Optional[str] = None,
):
    """Open a DB session with app.* GUC vars set for RLS policies."""
    async with AsyncSessionLocal() as session:
        await session.execute(text("SELECT set_config('app.user_id', :v, true)"), {"v": user_id})
        if tenant_id:
            await session.execute(text("SELECT set_config('app.tenant_id', :v, true)"), {"v": tenant_id})
        await session.execute(
            text("SELECT set_config('app.is_platform_staff', :v, true)"),
            {"v": "true" if is_platform_staff else "false"},
        )
        if staff_role:
            await session.execute(text("SELECT set_config('app.staff_role', :v, true)"), {"v": staff_role})
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
