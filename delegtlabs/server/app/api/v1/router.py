from fastapi import APIRouter

from app.api.v1.admin.router import router as admin_router
from app.api.v1.user.router import router as user_router
from app.api.v1.web.router import router as web_router

api_router = APIRouter()
# Surfaces are mounted with prefixes in app.main — this aggregates for discoverability.
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
api_router.include_router(user_router, prefix="/user", tags=["user"])
api_router.include_router(web_router, prefix="/web", tags=["web"])
