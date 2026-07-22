import importlib.util
import os
from fastapi import APIRouter

from user.api.v1.endpoints import health, profile
from shared.agent_registry import get_registered_agents

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])


@api_router.get("/agents/registered", tags=["agents"])
async def list_registered_agents():
    agents = get_registered_agents()
    return [
        {
            "slug": a["slug"],
            "name": a["name"],
            "category": a.get("category"),
            "version": a.get("version", "1.0.0"),
            "admin_route": a.get("admin_route"),
            "user_route": a.get("user_route"),
            "worker_schedule": a.get("worker_schedule"),
            "capabilities": a.get("capabilities", []),
            "status": a.get("status", "active"),
        }
        for a in agents
    ]


@api_router.get("/dashboard", tags=["user-dashboard"])
async def get_user_global_dashboard():
    registered = get_registered_agents()
    purchased_agents = [
        {
            "slug": a["slug"],
            "name": a["name"],
            "category": a.get("category"),
            "status": a.get("status", "active"),
            "monthly_price": float(a.get("base_price_usd", 199.0)),
            "connected": True,
            "user_route": a.get("user_route"),
            "capabilities": a.get("capabilities", []),
            "worker_schedule": a.get("worker_schedule"),
        }
        for a in registered
    ]
    total = sum(p["monthly_price"] for p in purchased_agents)

    return {
        "client_name": "Acme SaaS Inc.",
        "plan_name": "Growth Pro Plan",
        "renewal_date": "2026-08-01T00:00:00Z",
        "total_monthly_spend": total,
        "purchased_agents": purchased_agents,
        "aggregate_metrics": {
            "total_leads": 482,
            "total_posts": 34,
            "total_drafts": 12,
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
