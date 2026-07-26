from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from shared.integrations.supabase_rest import sb_delete, sb_insert, sb_select, sb_update, supabase_ready
from shared.schemas.agents import (
    AgentCreate,
    AgentRecord,
    AgentUpdate,
    agent_to_row,
    default_listing_for_slug,
    derive_price_fields,
    row_to_agent,
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _seed() -> list[AgentRecord]:
    now = _now()
    seeds = [
        ("linkedin-agent", "LinkedIn Growth Agent", "linkedin", "2.0.0"),
        ("lawyer-agent", "Lawyer Drafting Agent", "legal", "1.0.0"),
    ]
    out: list[AgentRecord] = []
    for slug, name, category, version in seeds:
        listing = default_listing_for_slug(slug)
        out.append(
            AgentRecord(
                id=str(uuid4()),
                name=name,
                slug=slug,
                description=listing.shortDescription,
                category=category,
                version=version,
                status="active",
                createdAt=now,
                updatedAt=now,
                listing=listing,
                config={},
            )
        )
    return out


class AgentRepository:
    def __init__(self) -> None:
        self._lock = Lock()
        self._memory: dict[str, AgentRecord] = {a.id: a for a in _seed()}

    async def list_agents(self, *, public_only: bool = False) -> list[AgentRecord]:
        if supabase_ready():
            rows = await sb_select("agents", params={"select": "*", "order": "updated_at.desc"})
            agents = [row_to_agent(r) for r in rows]
        else:
            with self._lock:
                agents = sorted(
                    self._memory.values(),
                    key=lambda a: a.updatedAt,
                    reverse=True,
                )
        if public_only:
            return [
                a
                for a in agents
                if a.listing.listedOnWebsite and a.status == "active"
            ]
        return list(agents)

    async def get_agent(self, agent_id: str) -> AgentRecord | None:
        if supabase_ready():
            rows = await sb_select("agents", params={"select": "*", "id": f"eq.{agent_id}"})
            return row_to_agent(rows[0]) if rows else None
        with self._lock:
            return deepcopy(self._memory.get(agent_id))

    async def get_by_slug(self, slug: str) -> AgentRecord | None:
        if supabase_ready():
            rows = await sb_select("agents", params={"select": "*", "slug": f"eq.{slug}"})
            return row_to_agent(rows[0]) if rows else None
        with self._lock:
            for agent in self._memory.values():
                if agent.slug == slug:
                    return deepcopy(agent)
            return None

    async def create_agent(self, payload: AgentCreate) -> AgentRecord:
        now = _now()
        listing = derive_price_fields(payload.listing or default_listing_for_slug(payload.slug))
        agent = AgentRecord(
            id=str(uuid4()),
            name=payload.name.strip(),
            slug=payload.slug.strip(),
            description=(payload.description or listing.shortDescription).strip(),
            category=(payload.category or "").strip(),
            version=(payload.version or "1.0.0").strip(),
            status=payload.status,
            createdAt=now,
            updatedAt=now,
            listing=listing,
            config=payload.config or {},
        )
        if supabase_ready():
            row = await sb_insert("agents", agent_to_row(agent))
            return row_to_agent(row)
        with self._lock:
            self._memory[agent.id] = agent
            return deepcopy(agent)

    async def update_agent(self, agent_id: str, payload: AgentUpdate) -> AgentRecord | None:
        current = await self.get_agent(agent_id)
        if not current:
            return None
        data = current.model_dump()
        patch = payload.model_dump(exclude_unset=True)
        if "listing" in patch and patch["listing"] is not None:
            listing = derive_price_fields(
                type(current.listing).model_validate(patch["listing"])
            )
            data["listing"] = listing.model_dump()
            del patch["listing"]
        data.update({k: v for k, v in patch.items() if v is not None})
        data["updatedAt"] = _now()
        updated = AgentRecord.model_validate(data)
        updated.listing = derive_price_fields(updated.listing)
        if supabase_ready():
            row = await sb_update("agents", {"id": agent_id}, agent_to_row(updated))
            return row_to_agent(row)
        with self._lock:
            self._memory[agent_id] = updated
            return deepcopy(updated)

    async def delete_agent(self, agent_id: str) -> bool:
        if supabase_ready():
            existing = await self.get_agent(agent_id)
            if not existing:
                return False
            await sb_delete("agents", {"id": agent_id})
            return True
        with self._lock:
            return self._memory.pop(agent_id, None) is not None


agent_repo = AgentRepository()
