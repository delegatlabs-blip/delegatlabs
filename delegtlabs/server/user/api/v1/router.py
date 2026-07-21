import importlib.util
import os
from fastapi import APIRouter

from user.api.v1.endpoints import health, profile
from shared.agent_registry import get_registered_agents

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])


@api_router.get("/dashboard", tags=["user-dashboard"])
async def get_user_global_dashboard():
    # Global strip aggregated across all agents from agent_metrics_daily
    purchased_agents = [
        {
            "slug": "linkedin-agent",
            "name": "LinkedIn Growth Agent",
            "category": "linkedin",
            "status": "active",
            "monthly_price": 250.00,
            "connected": True,
        },
        {
            "slug": "email-agent",
            "name": "Outbound Email Agent",
            "category": "email",
            "status": "active",
            "monthly_price": 199.00,
            "connected": False,
        },
    ]

    return {
        "client_name": "Acme SaaS Inc.",
        "plan_name": "Growth Pro Plan",
        "renewal_date": "2026-08-01T00:00:00Z",
        "total_monthly_spend": 449.00,
        "purchased_agents": purchased_agents,
        "aggregate_metrics": {
            "total_leads": 482,
            "total_posts": 34,
        },
    }


# Auto-mount all agent user routers from packages/agents/*/backend/router_user.py
for agent in get_registered_agents():
    pkg_path = agent.get("_package_path")
    if pkg_path:
        router_path = os.path.join(pkg_path, "backend", "router_user.py")
        if os.path.exists(router_path):
            module_name = f"agent_user_router_{agent['slug'].replace('-', '_')}"
            spec = importlib.util.spec_from_file_location(module_name, router_path)
            if spec and spec.loader:
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                if hasattr(mod, "router"):
                    api_router.include_router(mod.router)
