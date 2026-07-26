from fastapi import APIRouter

from admin.api.v1.endpoints import agents, customers, health, users

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
