from app.repositories.user_repository import UserRepository, user_repo
from app.schemas.users import UserCreate, UserRecord, UserUpdate


class UserService:
    def __init__(self, repo: UserRepository | None = None) -> None:
        self._repo = repo or user_repo

    async def list_users(self) -> list[UserRecord]:
        return await self._repo.list_users()

    async def get_user(self, user_id: str) -> UserRecord | None:
        return await self._repo.get_user(user_id)

    async def create_user(self, payload: UserCreate) -> UserRecord:
        return await self._repo.create_user(payload)

    async def update_user(self, user_id: str, payload: UserUpdate) -> UserRecord | None:
        return await self._repo.update_user(user_id, payload)

    async def delete_user(self, user_id: str) -> bool:
        return await self._repo.delete_user(user_id)


user_service = UserService()
