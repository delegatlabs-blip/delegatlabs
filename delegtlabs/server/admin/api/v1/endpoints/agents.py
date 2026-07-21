from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from admin.modules.platform.audit import write_audit_log
from admin.modules.platform.models import Agent, ClientAgent, PriceHistory
from admin.modules.platform.schemas import AgentCreate, AgentRead, AgentUpdate, PriceHistoryRead
from admin.modules.platform.security import AdminPrincipal, get_admin_principal
from shared.db.session import get_db

router = APIRouter()


@router.get("", response_model=list[AgentRead])
async def list_agents(
    category: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
) -> list[Agent]:
    query = select(Agent)
    if category:
        query = query.where(Agent.category == category)
    if status_filter:
        query = query.where(Agent.status == status_filter)
    result = await db.execute(query.order_by(Agent.created_at.desc()))
    return list(result.scalars())


@router.post("", response_model=AgentRead, status_code=status.HTTP_201_CREATED)
async def create_agent(
    payload: AgentCreate,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> Agent:
    agent = Agent(**payload.model_dump())
    db.add(agent)
    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="create_agent",
        target_type="agent",
        target_id=None,
        metadata={"after": payload.model_dump(mode="json")},
    )
    await db.commit()
    await db.refresh(agent)
    return agent


@router.get("/{agent_id}", response_model=AgentRead)
async def get_agent(agent_id: UUID, db: AsyncSession = Depends(get_db)) -> Agent:
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.put("/{agent_id}", response_model=AgentRead)
async def update_agent(
    agent_id: UUID,
    payload: AgentUpdate,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> Agent:
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    before = {
        "base_price_inr": str(agent.base_price_inr),
        "base_price_usd": str(agent.base_price_usd),
        "status": agent.status,
    }
    data = payload.model_dump(exclude_unset=True)
    old_price_inr = Decimal(agent.base_price_inr)
    old_price_usd = Decimal(agent.base_price_usd)
    for key, value in data.items():
        setattr(agent, key, value)

    if "base_price_inr" in data and Decimal(data["base_price_inr"]) != old_price_inr:
        db.add(
            PriceHistory(
                entity_type="agent",
                entity_id=agent.id,
                old_price=old_price_inr,
                new_price=Decimal(data["base_price_inr"]),
                changed_by=admin.user_id,
            )
        )
    if "base_price_usd" in data and Decimal(data["base_price_usd"]) != old_price_usd:
        db.add(
            PriceHistory(
                entity_type="agent",
                entity_id=agent.id,
                old_price=old_price_usd,
                new_price=Decimal(data["base_price_usd"]),
                changed_by=admin.user_id,
            )
        )

    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="update_agent",
        target_type="agent",
        target_id=str(agent.id),
        metadata={"before": before, "after": data},
    )
    await db.commit()
    await db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> None:
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    active_usage = await db.execute(
        select(ClientAgent).where(ClientAgent.agent_id == agent_id, ClientAgent.status == "active")
    )
    if active_usage.scalars().first():
        raise HTTPException(status_code=409, detail="Agent has active client assignments")

    agent.status = "deprecated"
    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="deprecate_agent",
        target_type="agent",
        target_id=str(agent.id),
        metadata={"after": {"status": "deprecated"}},
    )
    await db.commit()


@router.get("/{agent_id}/price-history", response_model=list[PriceHistoryRead])
async def get_agent_price_history(agent_id: UUID, db: AsyncSession = Depends(get_db)) -> list[PriceHistory]:
    result = await db.execute(
        select(PriceHistory).where(PriceHistory.entity_type == "agent", PriceHistory.entity_id == agent_id)
    )
    return list(result.scalars())
