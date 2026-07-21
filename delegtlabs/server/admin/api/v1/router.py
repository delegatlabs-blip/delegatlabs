from fastapi import APIRouter

from admin.api.v1.endpoints import agents, audit_log, clients, health, plans, subscriptions

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(subscriptions.router, prefix="/clients", tags=["subscriptions"])
api_router.include_router(audit_log.router, prefix="/audit-log", tags=["audit-log"])
