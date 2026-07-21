import importlib.util
import os
from typing import Any
from fastapi import APIRouter, Body

_dir = os.path.dirname(__file__)
_schemas_path = os.path.join(_dir, "schemas.py")
_spec_s = importlib.util.spec_from_file_location("lawyer_schemas", _schemas_path)
_mod_s = importlib.util.module_from_spec(_spec_s)
_spec_s.loader.exec_module(_mod_s)
LawyerAgentConfigSchema = _mod_s.LawyerAgentConfigSchema
DraftGenerationRequest = _mod_s.DraftGenerationRequest

_service_path = os.path.join(_dir, "service.py")
_spec_srv = importlib.util.spec_from_file_location("lawyer_service", _service_path)
_mod_srv = importlib.util.module_from_spec(_spec_srv)
_spec_srv.loader.exec_module(_mod_srv)
LawyerAgentService = _mod_srv.LawyerAgentService

router = APIRouter(prefix="/agents/lawyer-agent", tags=["user-lawyer-agent"])

_in_memory_config: dict[str, Any] = {}
_DEFAULT_CONFIG = {
    "jurisdiction": "Uttar Pradesh",
    "ui_language": "en",
    "draft_language": "en",
    "ai_provider": "mock",
    "firm_name": "DelegatLabs Legal Desk",
}


@router.get("/config")
async def get_config():
    return _in_memory_config.get("config", _DEFAULT_CONFIG)


@router.post("/config")
async def update_config(payload: LawyerAgentConfigSchema = Body(...)):
    _in_memory_config["config"] = payload.model_dump()
    return {"status": "success", "config": _in_memory_config["config"]}


@router.get("/stats")
async def get_stats():
    return LawyerAgentService.get_user_stats()


@router.post("/generate-draft")
async def generate_draft(payload: DraftGenerationRequest = Body(...)):
    data = payload.model_dump(by_alias=True)
    # Attach configured provider preference if present
    cfg = _in_memory_config.get("config", _DEFAULT_CONFIG)
    data["ai_provider"] = cfg.get("ai_provider", "mock")
    return LawyerAgentService.generate_draft(data)
