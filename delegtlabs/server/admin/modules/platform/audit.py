from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from admin.modules.platform.models import AuditLog


async def write_audit_log(
    session: AsyncSession,
    *,
    admin_user_id: str,
    action: str,
    target_type: str,
    target_id: str | None,
    metadata: dict[str, Any],
) -> None:
    session.add(
        AuditLog(
            admin_user_id=admin_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            metadata_json=metadata,
        )
    )
