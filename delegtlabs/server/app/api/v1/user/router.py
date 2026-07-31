import importlib.util
import os

from fastapi import APIRouter, Depends

from app.agent_registry import get_registered_agents
from app.api.deps import get_current_tenant
from app.api.v1.user.endpoints import auth, health, members, profile
from app.domain.tenant.context import TenantContext
from app.domain.tenant.scoping import require_tenant_id

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(profile.router, prefix="/profile", tags=["profile"])
router.include_router(members.router, prefix="/members", tags=["members"])


@router.get("/agents/registered", tags=["agents"])
async def list_registered_agents(ctx: TenantContext = Depends(get_current_tenant)):
    require_tenant_id(ctx)
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


@router.get("/dashboard", tags=["user-dashboard"])
async def get_user_global_dashboard(ctx: TenantContext = Depends(get_current_tenant)):
    tenant_id = require_tenant_id(ctx)
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
        "tenant_id": str(tenant_id),
        "client_name": "Workspace",
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
                    router.include_router(mod.router)
