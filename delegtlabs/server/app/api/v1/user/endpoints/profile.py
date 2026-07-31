from fastapi import APIRouter, Depends

from app.api.deps import get_current_tenant
from app.domain.tenant.context import TenantContext
from app.domain.tenant.scoping import require_tenant_id
from pydantic import BaseModel

router = APIRouter()


class ProfileRead(BaseModel):
    id: str
    email: str
    display_name: str
    tenant_id: str
    role: str


@router.get("/me", response_model=ProfileRead)
async def get_me(ctx: TenantContext = Depends(get_current_tenant)) -> ProfileRead:
    tenant_id = require_tenant_id(ctx)
    return ProfileRead(
        id=str(ctx.user_id),
        email=ctx.email,
        display_name=ctx.email.split("@")[0].replace(".", " ").title() or "User",
        tenant_id=str(tenant_id),
        role=ctx.role,
    )
