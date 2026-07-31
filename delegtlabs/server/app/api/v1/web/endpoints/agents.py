from fastapi import APIRouter, HTTPException

from app.services.agent_service import agent_service

router = APIRouter()


@router.get("/agents")
async def list_public_agents():
    agents = await agent_service.list_agents(public_only=True)
    return [a.model_dump() for a in agents]


@router.get("/agents/{agent_ref}")
async def get_public_agent(agent_ref: str):
    agent = await agent_service.get_agent(agent_ref)
    if not agent:
        agent = await agent_service.get_by_slug(agent_ref)
    if not agent or not agent.listing.listedOnWebsite or agent.status != "active":
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent.model_dump()
