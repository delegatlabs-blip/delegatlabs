from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from admin.modules.platform.models import AuditLog
from admin.modules.platform.schemas import AuditLogRead
from shared.db.session import get_db

router = APIRouter()


@router.get("", response_model=list[AuditLogRead])
async def get_audit_log(
    admin_user_id: str | None = None,
    target_type: str | None = None,
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[AuditLogRead]:
    query = select(AuditLog)
    if admin_user_id:
        query = query.where(AuditLog.admin_user_id == admin_user_id)
    if target_type:
        query = query.where(AuditLog.target_type == target_type)
    if start_date:
        query = query.where(AuditLog.created_at >= start_date)
    if end_date:
        query = query.where(AuditLog.created_at <= end_date)
    result = await db.execute(query.order_by(AuditLog.created_at.desc()))
    rows = list(result.scalars())
    return [
        AuditLogRead(
            id=row.id,
            admin_user_id=row.admin_user_id,
            action=row.action,
            target_type=row.target_type,
            target_id=row.target_id,
            metadata=row.metadata_json,
            created_at=row.created_at,
        )
        for row in rows
    ]
