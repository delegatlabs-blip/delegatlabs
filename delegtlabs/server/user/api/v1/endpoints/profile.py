from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ProfileRead(BaseModel):
    id: str
    email: str
    display_name: str


@router.get("/me", response_model=ProfileRead)
async def get_me() -> ProfileRead:
    return ProfileRead(
        id="user_demo",
        email="demo@delegtlabs.com",
        display_name="Demo User",
    )
