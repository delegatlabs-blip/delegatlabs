from fastapi import APIRouter

from shared.core.config import settings
from shared.enums import AppSurface
from shared.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def api_health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app=settings.app_name,
        app_version=settings.app_version,
        api_version=settings.api_version,
        surface=AppSurface.USER.value,
    )
