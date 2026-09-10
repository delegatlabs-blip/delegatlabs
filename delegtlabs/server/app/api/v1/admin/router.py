import importlib.util
import os

from fastapi import APIRouter

from app.agent_registry import get_registered_agents
from app.api.v1.admin.endpoints import agents, customers, health, users

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(agents.router, prefix="/agents", tags=["agents"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(customers.router, prefix="/customers", tags=["customers"])

# Pluggable agent admin routers (e.g. /api/admin/agents/linkedin-agent/stats)
for agent in get_registered_agents():
    pkg_path = agent.get("_package_path")
    if not pkg_path:
        continue
    router_path = os.path.join(pkg_path, "backend", "router_admin.py")
    if not os.path.exists(router_path):
        continue
    module_name = f"agent_admin_router_{agent['slug'].replace('-', '_')}"
    spec = importlib.util.spec_from_file_location(module_name, router_path)
    if spec and spec.loader:
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        if hasattr(mod, "router"):
            router.include_router(mod.router)
