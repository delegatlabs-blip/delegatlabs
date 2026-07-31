from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant, get_db
from app.domain.tenant.context import TenantContext
from app.schemas.auth import MemberCreate, MemberRead, MemberUpdate
from app.services.auth_service import MemberService

router = APIRouter()


@router.get("", response_model=list[MemberRead])
async def list_members(
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> list[MemberRead]:
    return await MemberService(db).list_members(ctx)


@router.get("/{member_id}", response_model=MemberRead)
async def get_member(
    member_id: UUID,
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> MemberRead:
    return await MemberService(db).get_member(ctx, member_id)


@router.post("", response_model=MemberRead, status_code=201)
async def create_member(
    payload: MemberCreate,
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> MemberRead:
    """Create always stamps JWT tenant_id via stamp_tenant_id (never from body)."""
    return await MemberService(db).create_member(ctx, payload)


@router.put("/{member_id}", response_model=MemberRead)
async def update_member(
    member_id: UUID,
    payload: MemberUpdate,
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> MemberRead:
    return await MemberService(db).update_member(ctx, member_id, payload)


@router.delete("/{member_id}", status_code=204)
async def delete_member(
    member_id: UUID,
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> None:
    await MemberService(db).delete_member(ctx, member_id)
