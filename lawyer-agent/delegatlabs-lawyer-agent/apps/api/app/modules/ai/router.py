from fastapi import APIRouter, HTTPException
from typing import List
from app.modules.ai.schemas import DraftGenerationRequest, DraftGenerationResponse, ModelProviderStatus
from app.modules.ai.service import ai_router_service

router = APIRouter(prefix="/ai", tags=["AI Router"])


@router.post("/generate-draft", response_model=DraftGenerationResponse)
def generate_draft(request: DraftGenerationRequest):
    try:
        return ai_router_service.generate_draft(request)
    except NotImplementedError as nie:
        raise HTTPException(status_code=501, detail=str(nie))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/providers/status", response_model=List[ModelProviderStatus])
def get_providers_status():
    return ai_router_service.get_providers_status()
