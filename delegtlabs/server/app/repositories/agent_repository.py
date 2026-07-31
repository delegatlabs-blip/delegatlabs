from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AdminAgent
from app.core.database import get_session_factory
from app.schemas.agents import (
    AgentCreate,
    AgentRecord,
    AgentUpdate,
    agent_to_row,
    default_listing_for_slug,
    derive_price_fields,
    row_to_agent,
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_dt(value: str | datetime | None) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if not value:
        return datetime.now(timezone.utc)
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def _orm_to_row(row: AdminAgent) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "slug": row.slug,
        "category": row.category,
        "status": row.status,
        "version": row.version,
        "description": row.description,
        "short_description": row.short_description,
        "detailed_description": row.detailed_description,
        "tags": row.tags or [],
        "features": row.features or [],
        "redirect_url": row.redirect_url,
        "demo_url": row.demo_url,
        "documentation_url": row.documentation_url,
        "payment_type": row.payment_type,
        "subscription_plans": row.subscription_plans or [],
        "credit_packs": row.credit_packs or [],
        "price": float(row.price or 0),
        "currency": row.currency,
        "billing_interval": row.billing_interval,
        "plan_name": row.plan_name,
        "listed_on_website": row.listed_on_website,
        "featured": row.featured,
        "config": row.config or {},
        "created_at": row.created_at.isoformat() if row.created_at else _now(),
        "updated_at": row.updated_at.isoformat() if row.updated_at else _now(),
    }


def _apply_row(model: AdminAgent, data: dict) -> None:
    model.name = data["name"]
    model.slug = data["slug"]
    model.category = data.get("category") or ""
    model.status = data.get("status") or "draft"
    model.version = data.get("version") or "1.0.0"
    model.description = data.get("description") or ""
    model.short_description = data.get("short_description") or ""
    model.detailed_description = data.get("detailed_description") or ""
    model.tags = data.get("tags") or []
    model.features = data.get("features") or []
    model.redirect_url = data.get("redirect_url") or ""
    model.demo_url = data.get("demo_url") or ""
    model.documentation_url = data.get("documentation_url") or ""
    model.payment_type = data.get("payment_type") or "subscription"
    model.subscription_plans = data.get("subscription_plans") or []
    model.credit_packs = data.get("credit_packs") or []
    model.price = Decimal(str(data.get("price") or 0))
    model.currency = data.get("currency") or "USD"
    model.billing_interval = data.get("billing_interval") or "monthly"
    model.plan_name = data.get("plan_name") or ""
    model.listed_on_website = bool(data.get("listed_on_website", True))
    model.featured = bool(data.get("featured", False))
    model.config = data.get("config") or {}
    model.created_at = _parse_dt(data.get("created_at"))
    model.updated_at = _parse_dt(data.get("updated_at"))


class AgentRepository:
    async def list_agents(self, *, public_only: bool = False) -> list[AgentRecord]:
        async with get_session_factory()() as session:
            result = await session.execute(select(AdminAgent).order_by(AdminAgent.updated_at.desc()))
            agents = [row_to_agent(_orm_to_row(r)) for r in result.scalars().all()]
        if public_only:
            return [a for a in agents if a.listing.listedOnWebsite and a.status == "active"]
        return agents

    async def get_agent(self, agent_id: str) -> AgentRecord | None:
        async with get_session_factory()() as session:
            row = await self._get_orm(session, agent_id)
            return row_to_agent(_orm_to_row(row)) if row else None

    async def get_by_slug(self, slug: str) -> AgentRecord | None:
        async with get_session_factory()() as session:
            result = await session.execute(select(AdminAgent).where(AdminAgent.slug == slug).limit(1))
            row = result.scalar_one_or_none()
            return row_to_agent(_orm_to_row(row)) if row else None

    async def create_agent(self, payload: AgentCreate) -> AgentRecord:
        now = _now()
        listing = derive_price_fields(payload.listing or default_listing_for_slug(payload.slug))
        agent = AgentRecord(
            id=str(uuid4()),
            name=payload.name.strip(),
            slug=payload.slug.strip(),
            description=(payload.description or listing.shortDescription).strip(),
            category=(payload.category or "").strip(),
            version=(payload.version or "1.0.0").strip(),
            status=payload.status,
            createdAt=now,
            updatedAt=now,
            listing=listing,
            config=payload.config or {},
        )
        data = agent_to_row(agent)
        async with get_session_factory()() as session:
            model = AdminAgent(id=UUID(agent.id))
            _apply_row(model, data)
            session.add(model)
            await session.commit()
            await session.refresh(model)
            return row_to_agent(_orm_to_row(model))

    async def update_agent(self, agent_id: str, payload: AgentUpdate) -> AgentRecord | None:
        current = await self.get_agent(agent_id)
        if not current:
            return None
        data = current.model_dump()
        patch = payload.model_dump(exclude_unset=True)
        if "listing" in patch and patch["listing"] is not None:
            listing = derive_price_fields(type(current.listing).model_validate(patch["listing"]))
            data["listing"] = listing.model_dump()
            del patch["listing"]
        data.update({k: v for k, v in patch.items() if v is not None})
        data["updatedAt"] = _now()
        updated = AgentRecord.model_validate(data)
        updated.listing = derive_price_fields(updated.listing)
        row_data = agent_to_row(updated)
        async with get_session_factory()() as session:
            model = await self._get_orm(session, agent_id)
            if not model:
                return None
            _apply_row(model, row_data)
            await session.commit()
            await session.refresh(model)
            return row_to_agent(_orm_to_row(model))

    async def delete_agent(self, agent_id: str) -> bool:
        async with get_session_factory()() as session:
            model = await self._get_orm(session, agent_id)
            if not model:
                return False
            await session.delete(model)
            await session.commit()
            return True

    @staticmethod
    async def _get_orm(session: AsyncSession, agent_id: str) -> AdminAgent | None:
        try:
            uid = UUID(agent_id)
        except ValueError:
            return None
        return await session.get(AdminAgent, uid)


agent_repo = AgentRepository()
