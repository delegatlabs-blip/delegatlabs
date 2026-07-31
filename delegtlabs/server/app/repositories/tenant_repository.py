from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.tenant.scoping import apply_tenant_filter, stamp_tenant_id
from app.models.tenant import Tenant
from app.models.tenant_member import TenantMember


class TenantRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get(self, tenant_id: UUID) -> Tenant | None:
        return await self.db.get(Tenant, tenant_id)

    async def get_by_slug(self, slug: str) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.slug == slug))
        return result.scalar_one_or_none()

    async def create(self, *, name: str, slug: str) -> Tenant:
        tenant = Tenant(name=name, slug=slug, status="active")
        self.db.add(tenant)
        await self.db.flush()
        return tenant


class MemberRepository:
    """All queries go through apply_tenant_filter / stamp_tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_for_tenant(self, tenant_id: UUID) -> list[TenantMember]:
        stmt = apply_tenant_filter(select(TenantMember), TenantMember, tenant_id)
        stmt = stmt.order_by(TenantMember.created_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_for_tenant(self, tenant_id: UUID, member_id: UUID) -> TenantMember | None:
        stmt = apply_tenant_filter(
            select(TenantMember).where(TenantMember.id == member_id),
            TenantMember,
            tenant_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email_global(self, email: str) -> TenantMember | None:
        result = await self.db.execute(
            select(TenantMember).where(TenantMember.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def create(self, tenant_id: UUID, values: dict) -> TenantMember:
        payload = stamp_tenant_id(values, tenant_id)
        member = TenantMember(**payload)
        self.db.add(member)
        await self.db.flush()
        return member

    async def delete_for_tenant(self, tenant_id: UUID, member_id: UUID) -> bool:
        member = await self.get_for_tenant(tenant_id, member_id)
        if not member:
            return False
        await self.db.delete(member)
        await self.db.flush()
        return True
