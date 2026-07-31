from app.repositories.customer_repository import CustomerRepository, customer_repo
from app.schemas.customers import CustomerCreate, CustomerRecord, CustomerUpdate


class CustomerService:
    def __init__(self, repo: CustomerRepository | None = None) -> None:
        self._repo = repo or customer_repo

    async def list_customers(self) -> list[CustomerRecord]:
        return await self._repo.list_customers()

    async def get_customer(self, customer_id: str) -> CustomerRecord | None:
        return await self._repo.get_customer(customer_id)

    async def create_customer(self, payload: CustomerCreate) -> CustomerRecord:
        return await self._repo.create_customer(payload)

    async def update_customer(self, customer_id: str, payload: CustomerUpdate) -> CustomerRecord | None:
        return await self._repo.update_customer(customer_id, payload)

    async def delete_customer(self, customer_id: str) -> bool:
        return await self._repo.delete_customer(customer_id)


customer_service = CustomerService()
