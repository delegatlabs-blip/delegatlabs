from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.modules.drafting.router import router as drafting_router
from app.modules.ai.router import router as ai_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(drafting_router)
api_router.include_router(ai_router)
