from fastapi import APIRouter

router = APIRouter(prefix="/drafting", tags=["Drafting"])


@router.get("/status")
def drafting_status():
    return {
        "module": "drafting",
        "status": "ready",
        "scope": "mode_1_guided_drafting",
    }
