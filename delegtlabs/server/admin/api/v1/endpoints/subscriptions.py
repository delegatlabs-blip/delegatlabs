from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from admin.modules.platform.audit import write_audit_log
from admin.modules.platform.models import Client, ClientSubscription
from admin.modules.platform.schemas import SubscriptionCreate, SubscriptionRead, SubscriptionUpdate
from admin.modules.platform.security import AdminPrincipal, get_admin_principal
from shared.db.session import get_db

router = APIRouter()


async def _get_active_subscription(db: AsyncSession, client_id: UUID) -> ClientSubscription | None:
    return (
        await db.execute(
            select(ClientSubscription).where(
                ClientSubscription.client_id == client_id,
                ClientSubscription.status.in_(["active", "past_due"]),
            )
        )
    ).scalars().first()


@router.get("/{client_id}/subscription", response_model=SubscriptionRead | None)
async def get_subscription(client_id: UUID, db: AsyncSession = Depends(get_db)) -> ClientSubscription | None:
    return await _get_active_subscription(db, client_id)


@router.post("/{client_id}/subscription", response_model=SubscriptionRead, status_code=status.HTTP_201_CREATED)
async def assign_subscription(
    client_id: UUID,
    payload: SubscriptionCreate,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> ClientSubscription:
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    existing = await _get_active_subscription(db, client_id)
    if existing:
        raise HTTPException(status_code=409, detail="Subscription already exists")
    sub = ClientSubscription(client_id=client_id, **payload.model_dump())
    db.add(sub)
    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="assign_subscription",
        target_type="client_subscription",
        target_id=None,
        metadata={"client_id": str(client_id), "after": payload.model_dump(mode="json")},
    )
    await db.commit()
    await db.refresh(sub)
    return sub


@router.put("/{client_id}/subscription", response_model=SubscriptionRead)
async def update_subscription(
    client_id: UUID,
    payload: SubscriptionUpdate,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> ClientSubscription:
    sub = await _get_active_subscription(db, client_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    before = {"plan_id": str(sub.plan_id), "status": sub.status}
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(sub, key, value)
    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="update_subscription",
        target_type="client_subscription",
        target_id=str(sub.id),
        metadata={"before": before, "after": payload.model_dump(mode="json", exclude_unset=True)},
    )
    await db.commit()
    await db.refresh(sub)
    return sub


@router.delete("/{client_id}/subscription")
async def cancel_subscription(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> dict:
    sub = await _get_active_subscription(db, client_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.status = "cancelled"
    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="cancel_subscription",
        target_type="client_subscription",
        target_id=str(sub.id),
        metadata={"after": {"status": "cancelled"}},
    )
    await db.commit()
    return {"cancelled": True}
