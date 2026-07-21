import importlib.util
import os
from fastapi import APIRouter

from admin.api.v1.endpoints import agents, audit_log, clients, health, plans, subscriptions
from shared.agent_registry import get_registered_agents

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(subscriptions.router, prefix="/clients", tags=["subscriptions"])
api_router.include_router(audit_log.router, prefix="/audit-log", tags=["audit-log"])

# Auto-mount all agent admin routers from packages/agents/*/backend/router_admin.py
for agent in get_registered_agents():
    pkg_path = agent.get("_package_path")
    if pkg_path:
        router_path = os.path.join(pkg_path, "backend", "router_admin.py")
        if os.path.exists(router_path):
            module_name = f"agent_admin_router_{agent['slug'].replace('-', '_')}"
            spec = importlib.util.spec_from_file_location(module_name, router_path)
            if spec and spec.loader:
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                if hasattr(mod, "router"):
                    api_router.include_router(mod.router)
