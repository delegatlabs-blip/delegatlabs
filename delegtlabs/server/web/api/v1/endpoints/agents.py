from fastapi import APIRouter, HTTPException

from shared.repositories.agents import agent_repo

router = APIRouter()


@router.get("/agents")
async def list_public_agents():
    agents = await agent_repo.list_agents(public_only=True)
    return [a.model_dump() for a in agents]


@router.get("/agents/{agent_ref}")
async def get_public_agent(agent_ref: str):
    agent = await agent_repo.get_agent(agent_ref)
    if not agent:
        agent = await agent_repo.get_by_slug(agent_ref)
    if not agent or not agent.listing.listedOnWebsite or agent.status != "active":
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent.model_dump()
