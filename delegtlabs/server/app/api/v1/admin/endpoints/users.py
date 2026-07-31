from fastapi import APIRouter, HTTPException

from app.services.user_service import user_service
from app.schemas.users import UserCreate, UserUpdate

router = APIRouter()


@router.get("")
async def list_users():
    return [u.model_dump() for u in await user_service.list_users()]


@router.get("/{user_id}")
async def get_user(user_id: str):
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.model_dump()


@router.post("", status_code=201)
async def create_user(payload: UserCreate):
    user = await user_service.create_user(payload)
    return user.model_dump()


@router.put("/{user_id}")
async def update_user(user_id: str, payload: UserUpdate):
    user = await user_service.update_user(user_id, payload)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.model_dump()


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str):
    ok = await user_service.delete_user(user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    return None
