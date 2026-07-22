from typing import Any

from fastapi import APIRouter

from shared.agent_registry import get_registered_agents

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/registered")
async def list_registered_agents() -> list[dict[str, Any]]:
    """HTTP wrapper around get_registered_agents() for marketplace/nav."""
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
            "description": a.get("description", ""),
            "base_price_usd": a.get("base_price_usd", 199.0),
            "base_price_inr": a.get("base_price_inr", 15999.0),
        }
        for a in agents
    ]
