from fastapi import APIRouter, HTTPException

from shared.repositories.agents import agent_repo
from shared.schemas.agents import AgentCreate, AgentUpdate

router = APIRouter()


@router.get("")
async def list_agents():
    return [a.model_dump() for a in await agent_repo.list_agents()]


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    agent = await agent_repo.get_agent(agent_id)
    if not agent:
        agent = await agent_repo.get_by_slug(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent.model_dump()


@router.post("", status_code=201)
async def create_agent(payload: AgentCreate):
    agent = await agent_repo.create_agent(payload)
    return agent.model_dump()


@router.put("/{agent_id}")
async def update_agent(agent_id: str, payload: AgentUpdate):
    agent = await agent_repo.update_agent(agent_id, payload)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent.model_dump()


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: str):
    ok = await agent_repo.delete_agent(agent_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Agent not found")
    return None
