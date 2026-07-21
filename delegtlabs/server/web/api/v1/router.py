from fastapi import APIRouter

from web.api.v1.endpoints import health, public
from web.modules.public.checkout import router as checkout_router

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(public.router, prefix="/public", tags=["public"])
api_router.include_router(checkout_router, prefix="/public", tags=["public-checkout"])
