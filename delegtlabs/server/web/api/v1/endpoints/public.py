from fastapi import APIRouter
from pydantic import BaseModel

from shared.core.config import settings

router = APIRouter()


class SiteMeta(BaseModel):
    name: str
    tagline: str
    app_version: str
    api_version: str


@router.get("/meta", response_model=SiteMeta)
async def site_meta() -> SiteMeta:
    return SiteMeta(
        name=settings.app_name,
        tagline="Delegation infrastructure for modern teams",
        app_version=settings.app_version,
        api_version=settings.api_version,
    )
