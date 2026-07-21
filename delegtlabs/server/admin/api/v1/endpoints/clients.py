from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from admin.modules.platform.audit import write_audit_log
from admin.modules.platform.models import Client, ClientAgent, ClientSubscription
from admin.modules.platform.schemas import (
    ClientAgentCreate,
    ClientAgentRead,
    ClientAgentUpdate,
    ClientDetail,
    ClientRead,
    ClientStatusUpdate,
    ImpersonationTokenRead,
)
from admin.modules.platform.security import AdminPrincipal, get_admin_principal
from shared.db.session import get_db

router = APIRouter()


@router.get("", response_model=list[ClientRead])
async def list_clients(
    search: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
) -> list[Client]:
    query = select(Client)
    if search:
        search_like = f"%{search}%"
        query = query.where(or_(Client.org_name.ilike(search_like), Client.owner_email.ilike(search_like)))
    if status_filter:
        query = query.where(Client.status == status_filter)
    result = await db.execute(query.order_by(Client.created_at.desc()))
    return list(result.scalars())


@router.get("/{client_id}", response_model=ClientDetail)
async def get_client_detail(client_id: UUID, db: AsyncSession = Depends(get_db)) -> ClientDetail:
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    sub = (
        await db.execute(
            select(ClientSubscription).where(
                ClientSubscription.client_id == client_id, ClientSubscription.status == "active"
            )
        )
    ).scalars().first()
    agents = list(
        (await db.execute(select(ClientAgent).where(ClientAgent.client_id == client_id, ClientAgent.status == "active"))).scalars()
    )
    usage_summary = {
        "active_agents": len(agents),
        "active_subscription": 1 if sub else 0,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    return ClientDetail(
        client=client,
        active_subscription=(
            {
                "id": str(sub.id),
                "plan_id": str(sub.plan_id),
                "status": sub.status,
                "renews_at": sub.renews_at.isoformat(),
            }
            if sub
            else None
        ),
        active_agents=[{"id": str(a.id), "agent_id": str(a.agent_id), "status": a.status} for a in agents],
        usage_summary=usage_summary,
    )


@router.patch("/{client_id}/status", response_model=ClientRead)
async def update_client_status(
    client_id: UUID,
    payload: ClientStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> Client:
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    before = client.status
    client.status = payload.status
    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="update_client_status",
        target_type="client",
        target_id=str(client.id),
        metadata={"before": {"status": before}, "after": payload.model_dump()},
    )
    await db.commit()
    await db.refresh(client)
    return client


@router.post("/{client_id}/impersonate", response_model=ImpersonationTokenRead)
async def impersonate_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> ImpersonationTokenRead:
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    token = f"imp_{client_id}_{int(datetime.now(timezone.utc).timestamp())}"
    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="impersonate_client",
        target_type="client",
        target_id=str(client.id),
        metadata={"token_preview": token[:24]},
    )
    await db.commit()
    return ImpersonationTokenRead(token=token)


@router.post("/{client_id}/agents", response_model=ClientAgentRead)
async def activate_client_agent(
    client_id: UUID,
    payload: ClientAgentCreate,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> ClientAgent:
    existing = (
        await db.execute(
            select(ClientAgent).where(
                and_(ClientAgent.client_id == client_id, ClientAgent.agent_id == payload.agent_id)
            )
        )
    ).scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="Client agent already exists")
    row = ClientAgent(client_id=client_id, **payload.model_dump())
    db.add(row)
    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="activate_client_agent",
        target_type="client_agent",
        target_id=None,
        metadata={"after": payload.model_dump(mode="json"), "client_id": str(client_id)},
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/{client_id}/agents/{agent_id}", response_model=ClientAgentRead)
async def update_client_agent(
    client_id: UUID,
    agent_id: UUID,
    payload: ClientAgentUpdate,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> ClientAgent:
    row = (
        await db.execute(
            select(ClientAgent).where(and_(ClientAgent.client_id == client_id, ClientAgent.agent_id == agent_id))
        )
    ).scalars().first()
    if not row:
        raise HTTPException(status_code=404, detail="Client agent not found")
    before = {"status": row.status, "custom_price": str(row.custom_price) if row.custom_price else None}
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="update_client_agent",
        target_type="client_agent",
        target_id=str(row.id),
        metadata={"before": before, "after": payload.model_dump(mode="json", exclude_unset=True)},
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{client_id}/agents/{agent_id}")
async def delete_client_agent(
    client_id: UUID,
    agent_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> dict:
    row = (
        await db.execute(
            select(ClientAgent).where(and_(ClientAgent.client_id == client_id, ClientAgent.agent_id == agent_id))
        )
    ).scalars().first()
    if not row:
        raise HTTPException(status_code=404, detail="Client agent not found")
    await db.delete(row)
    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="delete_client_agent",
        target_type="client_agent",
        target_id=str(row.id),
        metadata={},
    )
    await db.commit()
    return {"deleted": True}
