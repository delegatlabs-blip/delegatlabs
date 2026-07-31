from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AdminUser
from app.core.database import get_session_factory
from app.schemas.users import UserCreate, UserRecord, UserUpdate, new_user, row_to_user, user_to_row


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_dt(value: str | datetime | None) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if not value:
        return datetime.now(timezone.utc)
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def _orm_to_row(row: AdminUser) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "email": row.email,
        "phone": row.phone,
        "company": row.company,
        "role": row.role,
        "status": row.status,
        "notes": row.notes,
        "created_at": row.created_at.isoformat() if row.created_at else _now(),
        "updated_at": row.updated_at.isoformat() if row.updated_at else _now(),
    }


def _apply_row(model: AdminUser, data: dict) -> None:
    model.name = data["name"]
    model.email = data["email"]
    model.phone = data.get("phone") or ""
    model.company = data.get("company") or ""
    model.role = data.get("role") or "Viewer"
    model.status = data.get("status") or "active"
    model.notes = data.get("notes") or ""
    model.created_at = _parse_dt(data.get("created_at"))
    model.updated_at = _parse_dt(data.get("updated_at"))


class UserRepository:
    async def list_users(self) -> list[UserRecord]:
        async with get_session_factory()() as session:
            result = await session.execute(select(AdminUser).order_by(AdminUser.updated_at.desc()))
            return [row_to_user(_orm_to_row(r)) for r in result.scalars().all()]

    async def get_user(self, user_id: str) -> UserRecord | None:
        async with get_session_factory()() as session:
            row = await self._get_orm(session, user_id)
            return row_to_user(_orm_to_row(row)) if row else None

    async def create_user(self, payload: UserCreate) -> UserRecord:
        user = new_user(payload)
        data = user_to_row(user)
        async with get_session_factory()() as session:
            model = AdminUser(id=UUID(user.id))
            _apply_row(model, data)
            session.add(model)
            await session.commit()
            await session.refresh(model)
            return row_to_user(_orm_to_row(model))

    async def update_user(self, user_id: str, payload: UserUpdate) -> UserRecord | None:
        current = await self.get_user(user_id)
        if not current:
            return None
        data = current.model_dump()
        data.update({k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None})
        data["updatedAt"] = _now()
        updated = UserRecord.model_validate(data)
        row_data = user_to_row(updated)
        async with get_session_factory()() as session:
            model = await self._get_orm(session, user_id)
            if not model:
                return None
            _apply_row(model, row_data)
            await session.commit()
            await session.refresh(model)
            return row_to_user(_orm_to_row(model))

    async def delete_user(self, user_id: str) -> bool:
        async with get_session_factory()() as session:
            model = await self._get_orm(session, user_id)
            if not model:
                return False
            await session.delete(model)
            await session.commit()
            return True

    @staticmethod
    async def _get_orm(session: AsyncSession, user_id: str) -> AdminUser | None:
        try:
            uid = UUID(user_id)
        except ValueError:
            return None
        return await session.get(AdminUser, uid)


user_repo = UserRepository()
