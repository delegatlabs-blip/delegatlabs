from fastapi import APIRouter

from web.api.v1.endpoints import agents, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(agents.router, tags=["agents"])
