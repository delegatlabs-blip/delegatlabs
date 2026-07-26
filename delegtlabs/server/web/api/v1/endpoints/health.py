from fastapi import APIRouter

from shared.integrations.supabase_rest import supabase_ready

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "surface": "web",
        "supabase": "connected" if supabase_ready() else "memory-fallback",
    }
