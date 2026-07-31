from fastapi import APIRouter

from app.api.v1.web.endpoints import agents, health

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(agents.router, tags=["agents"])
