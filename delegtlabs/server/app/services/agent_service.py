"""Business logic for agents — thin wrapper over the repository."""

from app.repositories.agent_repository import AgentRepository, agent_repo
from app.schemas.agents import AgentCreate, AgentRecord, AgentUpdate


class AgentService:
    def __init__(self, repo: AgentRepository | None = None) -> None:
        self._repo = repo or agent_repo

    async def list_agents(self, *, public_only: bool = False) -> list[AgentRecord]:
        return await self._repo.list_agents(public_only=public_only)

    async def get_agent(self, agent_id: str) -> AgentRecord | None:
        return await self._repo.get_agent(agent_id)

    async def get_by_slug(self, slug: str) -> AgentRecord | None:
        return await self._repo.get_by_slug(slug)

    async def create_agent(self, payload: AgentCreate) -> AgentRecord:
        return await self._repo.create_agent(payload)

    async def update_agent(self, agent_id: str, payload: AgentUpdate) -> AgentRecord | None:
        return await self._repo.update_agent(agent_id, payload)

    async def delete_agent(self, agent_id: str) -> bool:
        return await self._repo.delete_agent(agent_id)


agent_service = AgentService()
