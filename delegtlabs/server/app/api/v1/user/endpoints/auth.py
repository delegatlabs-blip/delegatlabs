from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant, get_db
from app.core.config import settings
from app.domain.tenant.context import TenantContext
from app.repositories.tenant_repository import MemberRepository
from app.schemas.auth import LoginRequest, MemberRead, RegisterRequest, TokenResponse
from app.services.auth_service import AuthService, member_to_read
from app.utils.exceptions import AppError

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Create a tenant + owner; JWT includes tenant_id."""
    return await AuthService(db).register(payload)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Authenticate and issue a JWT with tenant_id claim."""
    return await AuthService(db).login(payload)


@router.get("/me", response_model=MemberRead)
async def me(
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> MemberRead:
    if settings.disable_user_auth:
        return MemberRead(
            id=str(ctx.user_id),
            tenant_id=str(ctx.tenant_id),
            name="Demo User",
            email=ctx.email,
            role=ctx.role,
            status="active",
            department="",
            notes="",
            last_login_at=None,
            created_at="",
            updated_at="",
        )

    row = await MemberRepository(db).get_for_tenant(ctx.tenant_id, ctx.user_id)
    if not row:
        raise AppError("Member not found", status_code=404, code="not_found")
    return member_to_read(row)
