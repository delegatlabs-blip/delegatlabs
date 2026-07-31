from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel


CustomerStatus = Literal["active", "trial", "churned", "suspended"]
CustomerPlan = Literal["Free", "Starter", "Pro", "Enterprise"]


class CustomerRecord(BaseModel):
    id: str
    name: str
    email: str
    phone: str = ""
    company: str = ""
    plan: CustomerPlan = "Starter"
    status: CustomerStatus = "active"
    agents_purchased: int = 0
    total_spend: float = 0
    notes: str = ""
    createdAt: str
    updatedAt: str


class CustomerCreate(BaseModel):
    name: str
    email: str
    phone: str = ""
    company: str = ""
    plan: CustomerPlan = "Starter"
    status: CustomerStatus = "active"
    agents_purchased: int = 0
    total_spend: float = 0
    notes: str = ""


class CustomerUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    plan: CustomerPlan | None = None
    status: CustomerStatus | None = None
    agents_purchased: int | None = None
    total_spend: float | None = None
    notes: str | None = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_customer(payload: CustomerCreate) -> CustomerRecord:
    now = _now()
    return CustomerRecord(
        id=str(uuid4()),
        name=payload.name.strip(),
        email=str(payload.email).lower(),
        phone=payload.phone,
        company=payload.company,
        plan=payload.plan,
        status=payload.status,
        agents_purchased=payload.agents_purchased,
        total_spend=payload.total_spend,
        notes=payload.notes,
        createdAt=now,
        updatedAt=now,
    )


def row_to_customer(row: dict) -> CustomerRecord:
    return CustomerRecord(
        id=str(row["id"]),
        name=row["name"],
        email=row["email"],
        phone=row.get("phone") or "",
        company=row.get("company") or "",
        plan=row.get("plan") or "Starter",
        status=row.get("status") or "active",
        agents_purchased=int(row.get("agents_purchased") or 0),
        total_spend=float(row.get("total_spend") or 0),
        notes=row.get("notes") or "",
        createdAt=str(row.get("created_at") or _now()),
        updatedAt=str(row.get("updated_at") or _now()),
    )


def customer_to_row(customer: CustomerRecord) -> dict:
    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "company": customer.company,
        "plan": customer.plan,
        "status": customer.status,
        "agents_purchased": customer.agents_purchased,
        "total_spend": customer.total_spend,
        "notes": customer.notes,
        "created_at": customer.createdAt,
        "updated_at": customer.updatedAt,
    }
