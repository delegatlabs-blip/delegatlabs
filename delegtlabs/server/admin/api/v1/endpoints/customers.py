from fastapi import APIRouter, HTTPException

from shared.repositories.customers import customer_repo
from shared.schemas.customers import CustomerCreate, CustomerUpdate

router = APIRouter()


@router.get("")
async def list_customers():
    return [c.model_dump() for c in await customer_repo.list_customers()]


@router.get("/{customer_id}")
async def get_customer(customer_id: str):
    customer = await customer_repo.get_customer(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer.model_dump()


@router.post("", status_code=201)
async def create_customer(payload: CustomerCreate):
    customer = await customer_repo.create_customer(payload)
    return customer.model_dump()


@router.put("/{customer_id}")
async def update_customer(customer_id: str, payload: CustomerUpdate):
    customer = await customer_repo.update_customer(customer_id, payload)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer.model_dump()


@router.delete("/{customer_id}", status_code=204)
async def delete_customer(customer_id: str):
    ok = await customer_repo.delete_customer(customer_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Customer not found")
    return None
