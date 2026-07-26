from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from shared.integrations.supabase_rest import sb_delete, sb_insert, sb_select, sb_update, supabase_ready
from shared.schemas.users import (
    UserCreate,
    UserRecord,
    UserUpdate,
    new_user,
    row_to_user,
    user_to_row,
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _seed() -> list[UserRecord]:
    now = _now()
    return [
        UserRecord(
            id=str(uuid4()),
            name="Avery Chen",
            email="avery@delegatelabs.com",
            phone="+1 555 0100",
            company="Delegate Labs",
            role="Owner",
            status="active",
            notes="Seed user",
            createdAt=now,
            updatedAt=now,
        )
    ]


class UserRepository:
    def __init__(self) -> None:
        self._lock = Lock()
        self._memory: dict[str, UserRecord] = {u.id: u for u in _seed()}

    async def list_users(self) -> list[UserRecord]:
        if supabase_ready():
            rows = await sb_select("users", params={"select": "*", "order": "updated_at.desc"})
            return [row_to_user(r) for r in rows]
        with self._lock:
            return sorted(self._memory.values(), key=lambda u: u.updatedAt, reverse=True)

    async def get_user(self, user_id: str) -> UserRecord | None:
        if supabase_ready():
            rows = await sb_select("users", params={"select": "*", "id": f"eq.{user_id}"})
            return row_to_user(rows[0]) if rows else None
        with self._lock:
            found = self._memory.get(user_id)
            return deepcopy(found) if found else None

    async def create_user(self, payload: UserCreate) -> UserRecord:
        user = new_user(payload)
        if supabase_ready():
            row = await sb_insert("users", user_to_row(user))
            return row_to_user(row)
        with self._lock:
            self._memory[user.id] = user
            return deepcopy(user)

    async def update_user(self, user_id: str, payload: UserUpdate) -> UserRecord | None:
        current = await self.get_user(user_id)
        if not current:
            return None
        data = current.model_dump()
        data.update({k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None})
        data["updatedAt"] = _now()
        updated = UserRecord.model_validate(data)
        if supabase_ready():
            row = await sb_update("users", {"id": user_id}, user_to_row(updated))
            return row_to_user(row)
        with self._lock:
            self._memory[user_id] = updated
            return deepcopy(updated)

    async def delete_user(self, user_id: str) -> bool:
        if supabase_ready():
            existing = await self.get_user(user_id)
            if not existing:
                return False
            await sb_delete("users", {"id": user_id})
            return True
        with self._lock:
            return self._memory.pop(user_id, None) is not None


user_repo = UserRepository()
