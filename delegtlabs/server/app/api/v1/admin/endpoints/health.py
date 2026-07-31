from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "surface": "admin",
        "storage": "postgresql",
        "database_configured": bool(settings.database_url),
        "auth": "disabled" if settings.disable_admin_auth else "enabled",
    }
