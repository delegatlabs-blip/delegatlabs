from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from shared.integrations.supabase_rest import sb_delete, sb_insert, sb_select, sb_update, supabase_ready
from shared.schemas.customers import (
    CustomerCreate,
    CustomerRecord,
    CustomerUpdate,
    customer_to_row,
    new_customer,
    row_to_customer,
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _seed() -> list[CustomerRecord]:
    now = _now()
    return [
        CustomerRecord(
            id=str(uuid4()),
            name="Jordan Brooks",
            email="jordan@northwindai.com",
            phone="+1 555 0200",
            company="Northwind AI",
            plan="Pro",
            status="active",
            agents_purchased=3,
            total_spend=597.0,
            notes="Seed customer",
            createdAt=now,
            updatedAt=now,
        )
    ]


class CustomerRepository:
    def __init__(self) -> None:
        self._lock = Lock()
        self._memory: dict[str, CustomerRecord] = {c.id: c for c in _seed()}

    async def list_customers(self) -> list[CustomerRecord]:
        if supabase_ready():
            rows = await sb_select("customers", params={"select": "*", "order": "updated_at.desc"})
            return [row_to_customer(r) for r in rows]
        with self._lock:
            return sorted(self._memory.values(), key=lambda c: c.updatedAt, reverse=True)

    async def get_customer(self, customer_id: str) -> CustomerRecord | None:
        if supabase_ready():
            rows = await sb_select("customers", params={"select": "*", "id": f"eq.{customer_id}"})
            return row_to_customer(rows[0]) if rows else None
        with self._lock:
            found = self._memory.get(customer_id)
            return deepcopy(found) if found else None

    async def create_customer(self, payload: CustomerCreate) -> CustomerRecord:
        customer = new_customer(payload)
        if supabase_ready():
            row = await sb_insert("customers", customer_to_row(customer))
            return row_to_customer(row)
        with self._lock:
            self._memory[customer.id] = customer
            return deepcopy(customer)

    async def update_customer(self, customer_id: str, payload: CustomerUpdate) -> CustomerRecord | None:
        current = await self.get_customer(customer_id)
        if not current:
            return None
        data = current.model_dump()
        data.update({k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None})
        data["updatedAt"] = _now()
        updated = CustomerRecord.model_validate(data)
        if supabase_ready():
            row = await sb_update("customers", {"id": customer_id}, customer_to_row(updated))
            return row_to_customer(row)
        with self._lock:
            self._memory[customer_id] = updated
            return deepcopy(updated)

    async def delete_customer(self, customer_id: str) -> bool:
        if supabase_ready():
            existing = await self.get_customer(customer_id)
            if not existing:
                return False
            await sb_delete("customers", {"id": customer_id})
            return True
        with self._lock:
            return self._memory.pop(customer_id, None) is not None


customer_repo = CustomerRepository()
