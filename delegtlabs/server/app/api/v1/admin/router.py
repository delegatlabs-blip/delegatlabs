from fastapi import APIRouter

from app.api.v1.admin.endpoints import agents, customers, health, users

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(agents.router, prefix="/agents", tags=["agents"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(customers.router, prefix="/customers", tags=["customers"])
