from __future__ import annotations

import secrets
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.domain.tenant.context import TenantContext
from app.domain.tenant.scoping import require_tenant_id
from app.models.tenant_member import TenantMember
from app.repositories.tenant_repository import MemberRepository, TenantRepository
from app.schemas.auth import (
    LoginRequest,
    MemberCreate,
    MemberRead,
    MemberUpdate,
    RegisterRequest,
    TokenResponse,
)
from app.utils.exceptions import AppError
from app.utils.strings import slugify


def _iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


def member_to_read(row: TenantMember) -> MemberRead:
    return MemberRead(
        id=str(row.id),
        tenant_id=str(row.tenant_id),
        name=row.name,
        email=row.email,
        role=row.role,
        status=row.status,  # type: ignore[arg-type]
        department=row.department or "",
        notes=row.notes or "",
        last_login_at=_iso(row.last_login_at),
        created_at=_iso(row.created_at) or "",
        updated_at=_iso(row.updated_at) or "",
    )


def _token_for(member: TenantMember) -> TokenResponse:
    token = create_access_token(
        subject=str(member.id),
        tenant_id=member.tenant_id,
        email=member.email,
        role=member.role,
    )
    return TokenResponse(
        access_token=token,
        tenant_id=str(member.tenant_id),
        user_id=str(member.id),
        email=member.email,
        role=member.role,
        name=member.name,
    )


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.tenants = TenantRepository(db)
        self.members = MemberRepository(db)
        self.db = db

    async def register(self, payload: RegisterRequest) -> TokenResponse:
        email = payload.email.strip().lower()
        existing = await self.members.get_by_email_global(email)
        if existing:
            raise AppError("Email already registered", status_code=409, code="email_taken")

        base_slug = slugify(payload.tenant_name) or "workspace"
        slug = base_slug
        n = 1
        while await self.tenants.get_by_slug(slug):
            n += 1
            slug = f"{base_slug}-{n}"

        tenant = await self.tenants.create(name=payload.tenant_name.strip(), slug=slug)
        member = await self.members.create(
            tenant.id,
            {
                "email": email,
                "name": payload.name.strip(),
                "password_hash": hash_password(payload.password),
                "role": "Owner",
                "status": "active",
                "department": "",
                "notes": "",
            },
        )
        await self.db.commit()
        await self.db.refresh(member)
        return _token_for(member)

    async def login(self, payload: LoginRequest) -> TokenResponse:
        email = payload.email.strip().lower()
        member = await self.members.get_by_email_global(email)
        if not member or not verify_password(payload.password, member.password_hash):
            raise AppError("Invalid email or password", status_code=401, code="invalid_credentials")
        if member.status == "suspended":
            raise AppError("Account suspended", status_code=403, code="suspended")

        member.last_login_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(member)
        return _token_for(member)


class MemberService:
    """Tenant-scoped team member CRUD — always uses require_tenant_id + repository filters."""

    def __init__(self, db: AsyncSession) -> None:
        self.members = MemberRepository(db)
        self.db = db

    async def list_members(self, ctx: TenantContext) -> list[MemberRead]:
        tenant_id = require_tenant_id(ctx)
        rows = await self.members.list_for_tenant(tenant_id)
        return [member_to_read(r) for r in rows]

    async def get_member(self, ctx: TenantContext, member_id: UUID) -> MemberRead:
        tenant_id = require_tenant_id(ctx)
        row = await self.members.get_for_tenant(tenant_id, member_id)
        if not row:
            raise AppError("Member not found", status_code=404, code="not_found")
        return member_to_read(row)

    async def create_member(self, ctx: TenantContext, payload: MemberCreate) -> MemberRead:
        tenant_id = require_tenant_id(ctx)
        email = payload.email.strip().lower()
        existing = await self.members.get_by_email_global(email)
        if existing and existing.tenant_id == tenant_id:
            raise AppError("Member already exists in this tenant", status_code=409, code="email_taken")
        if existing and existing.tenant_id != tenant_id:
            raise AppError("Email already registered", status_code=409, code="email_taken")

        password = payload.password or secrets.token_urlsafe(12)

        row = await self.members.create(
            tenant_id,
            {
                "email": email,
                "name": payload.name.strip(),
                "password_hash": hash_password(password),
                "role": payload.role,
                "status": payload.status,
                "department": payload.department or "",
                "notes": payload.notes or "",
            },
        )
        await self.db.commit()
        await self.db.refresh(row)
        return member_to_read(row)

    async def update_member(
        self, ctx: TenantContext, member_id: UUID, payload: MemberUpdate
    ) -> MemberRead:
        tenant_id = require_tenant_id(ctx)
        row = await self.members.get_for_tenant(tenant_id, member_id)
        if not row:
            raise AppError("Member not found", status_code=404, code="not_found")

        data = payload.model_dump(exclude_unset=True)
        if "email" in data and data["email"]:
            data["email"] = str(data["email"]).strip().lower()
        for key, value in data.items():
            setattr(row, key, value)
        await self.db.commit()
        await self.db.refresh(row)
        return member_to_read(row)

    async def delete_member(self, ctx: TenantContext, member_id: UUID) -> None:
        tenant_id = require_tenant_id(ctx)
        if member_id == ctx.user_id:
            raise AppError("Cannot delete your own account", status_code=400, code="self_delete")
        ok = await self.members.delete_for_tenant(tenant_id, member_id)
        if not ok:
            raise AppError("Member not found", status_code=404, code="not_found")
        await self.db.commit()
