from fastapi import APIRouter

from shared.core.config import settings
from shared.integrations.supabase_rest import supabase_ready

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "surface": "admin",
        "supabase": "connected" if supabase_ready() else "memory-fallback",
        "auth": "disabled" if settings.disable_admin_auth else "enabled",
    }
