from fastapi import APIRouter

from web.api.v1.endpoints import health, public

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(public.router, prefix="/public", tags=["public"])
