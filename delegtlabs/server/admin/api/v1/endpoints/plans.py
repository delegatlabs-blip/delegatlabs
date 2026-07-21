from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from admin.modules.platform.audit import write_audit_log
from admin.modules.platform.models import ClientSubscription, Plan, PlanAgent, PriceHistory
from admin.modules.platform.schemas import PlanCreate, PlanRead, PlanUpdate
from admin.modules.platform.security import AdminPrincipal, get_admin_principal
from shared.db.session import get_db

router = APIRouter()


def _to_plan_read(plan: Plan, plan_agents: list[PlanAgent]) -> PlanRead:
    return PlanRead(
        id=plan.id,
        name=plan.name,
        price_inr=plan.price_inr,
        price_usd=plan.price_usd,
        billing_cycle=plan.billing_cycle,
        max_agents=plan.max_agents,
        max_posts_per_month=plan.max_posts_per_month,
        features=plan.features,
        is_custom=plan.is_custom,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        included_agents=plan_agents,
    )


@router.get("", response_model=list[PlanRead])
async def list_plans(db: AsyncSession = Depends(get_db)) -> list[PlanRead]:
    plans = list((await db.execute(select(Plan).order_by(Plan.created_at.desc()))).scalars())
    response: list[PlanRead] = []
    for plan in plans:
        links = list((await db.execute(select(PlanAgent).where(PlanAgent.plan_id == plan.id))).scalars())
        response.append(_to_plan_read(plan, links))
    return response


@router.post("", response_model=PlanRead, status_code=status.HTTP_201_CREATED)
async def create_plan(
    payload: PlanCreate,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> PlanRead:
    data = payload.model_dump(exclude={"agents"})
    plan = Plan(**data)
    db.add(plan)
    await db.flush()
    for item in payload.agents:
        db.add(PlanAgent(plan_id=plan.id, **item.model_dump()))
    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="create_plan",
        target_type="plan",
        target_id=str(plan.id),
        metadata={"after": payload.model_dump(mode="json")},
    )
    await db.commit()
    links = list((await db.execute(select(PlanAgent).where(PlanAgent.plan_id == plan.id))).scalars())
    return _to_plan_read(plan, links)


@router.put("/{plan_id}", response_model=PlanRead)
async def update_plan(
    plan_id: UUID,
    payload: PlanUpdate,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> PlanRead:
    plan = await db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    data = payload.model_dump(exclude_unset=True, exclude={"agents"})
    before = {"price_inr": str(plan.price_inr), "price_usd": str(plan.price_usd)}
    old_price_inr = Decimal(plan.price_inr)
    old_price_usd = Decimal(plan.price_usd)
    for key, value in data.items():
        setattr(plan, key, value)

    if "price_inr" in data and Decimal(data["price_inr"]) != old_price_inr:
        db.add(
            PriceHistory(
                entity_type="plan",
                entity_id=plan.id,
                old_price=old_price_inr,
                new_price=Decimal(data["price_inr"]),
                changed_by=admin.user_id,
            )
        )
    if "price_usd" in data and Decimal(data["price_usd"]) != old_price_usd:
        db.add(
            PriceHistory(
                entity_type="plan",
                entity_id=plan.id,
                old_price=old_price_usd,
                new_price=Decimal(data["price_usd"]),
                changed_by=admin.user_id,
            )
        )

    if payload.agents is not None:
        await db.execute(delete(PlanAgent).where(PlanAgent.plan_id == plan.id))
        for item in payload.agents:
            db.add(PlanAgent(plan_id=plan.id, **item.model_dump()))

    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="update_plan",
        target_type="plan",
        target_id=str(plan.id),
        metadata={"before": before, "after": payload.model_dump(mode="json", exclude_unset=True)},
    )
    await db.commit()
    links = list((await db.execute(select(PlanAgent).where(PlanAgent.plan_id == plan.id))).scalars())
    return _to_plan_read(plan, links)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: AdminPrincipal = Depends(get_admin_principal),
) -> None:
    plan = await db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    active_refs = await db.execute(
        select(ClientSubscription).where(ClientSubscription.plan_id == plan_id, ClientSubscription.status == "active")
    )
    if active_refs.scalars().first():
        raise HTTPException(status_code=409, detail="Plan has active subscriptions")

    await db.delete(plan)
    await write_audit_log(
        db,
        admin_user_id=admin.user_id,
        action="delete_plan",
        target_type="plan",
        target_id=str(plan.id),
        metadata={},
    )
    await db.commit()
