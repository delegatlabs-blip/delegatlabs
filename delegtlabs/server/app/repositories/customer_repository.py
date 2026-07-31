from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AdminCustomer
from app.core.database import get_session_factory
from app.schemas.customers import (
    CustomerCreate,
    CustomerRecord,
    CustomerUpdate,
    customer_to_row,
    new_customer,
    row_to_customer,
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_dt(value: str | datetime | None) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if not value:
        return datetime.now(timezone.utc)
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def _orm_to_row(row: AdminCustomer) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "email": row.email,
        "phone": row.phone,
        "company": row.company,
        "plan": row.plan,
        "status": row.status,
        "agents_purchased": row.agents_purchased,
        "total_spend": float(row.total_spend or 0),
        "notes": row.notes,
        "created_at": row.created_at.isoformat() if row.created_at else _now(),
        "updated_at": row.updated_at.isoformat() if row.updated_at else _now(),
    }


def _apply_row(model: AdminCustomer, data: dict) -> None:
    model.name = data["name"]
    model.email = data["email"]
    model.phone = data.get("phone") or ""
    model.company = data.get("company") or ""
    model.plan = data.get("plan") or "Starter"
    model.status = data.get("status") or "active"
    model.agents_purchased = int(data.get("agents_purchased") or 0)
    model.total_spend = Decimal(str(data.get("total_spend") or 0))
    model.notes = data.get("notes") or ""
    model.created_at = _parse_dt(data.get("created_at"))
    model.updated_at = _parse_dt(data.get("updated_at"))


class CustomerRepository:
    async def list_customers(self) -> list[CustomerRecord]:
        async with get_session_factory()() as session:
            result = await session.execute(select(AdminCustomer).order_by(AdminCustomer.updated_at.desc()))
            return [row_to_customer(_orm_to_row(r)) for r in result.scalars().all()]

    async def get_customer(self, customer_id: str) -> CustomerRecord | None:
        async with get_session_factory()() as session:
            row = await self._get_orm(session, customer_id)
            return row_to_customer(_orm_to_row(row)) if row else None

    async def create_customer(self, payload: CustomerCreate) -> CustomerRecord:
        customer = new_customer(payload)
        data = customer_to_row(customer)
        async with get_session_factory()() as session:
            model = AdminCustomer(id=UUID(customer.id))
            _apply_row(model, data)
            session.add(model)
            await session.commit()
            await session.refresh(model)
            return row_to_customer(_orm_to_row(model))

    async def update_customer(self, customer_id: str, payload: CustomerUpdate) -> CustomerRecord | None:
        current = await self.get_customer(customer_id)
        if not current:
            return None
        data = current.model_dump()
        data.update({k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None})
        data["updatedAt"] = _now()
        updated = CustomerRecord.model_validate(data)
        row_data = customer_to_row(updated)
        async with get_session_factory()() as session:
            model = await self._get_orm(session, customer_id)
            if not model:
                return None
            _apply_row(model, row_data)
            await session.commit()
            await session.refresh(model)
            return row_to_customer(_orm_to_row(model))

    async def delete_customer(self, customer_id: str) -> bool:
        async with get_session_factory()() as session:
            model = await self._get_orm(session, customer_id)
            if not model:
                return False
            await session.delete(model)
            await session.commit()
            return True

    @staticmethod
    async def _get_orm(session: AsyncSession, customer_id: str) -> AdminCustomer | None:
        try:
            uid = UUID(customer_id)
        except ValueError:
            return None
        return await session.get(AdminCustomer, uid)


customer_repo = CustomerRepository()
