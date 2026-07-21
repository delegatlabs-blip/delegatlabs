import importlib.util
import os
from typing import Any
from fastapi import APIRouter, Body

_dir = os.path.dirname(__file__)
_schemas_path = os.path.join(_dir, "schemas.py")
_spec_s = importlib.util.spec_from_file_location("email_schemas", _schemas_path)
_mod_s = importlib.util.module_from_spec(_spec_s)
_spec_s.loader.exec_module(_mod_s)
EmailConfigSchema = _mod_s.EmailConfigSchema

_service_path = os.path.join(_dir, "service.py")
_spec_srv = importlib.util.spec_from_file_location("email_service", _service_path)
_mod_srv = importlib.util.module_from_spec(_spec_srv)
_spec_srv.loader.exec_module(_mod_srv)
EmailAgentService = _mod_srv.EmailAgentService

router = APIRouter(prefix="/agents/email-agent", tags=["user-email-agent"])

_in_memory_config: dict[str, Any] = {}


@router.get("/config")
async def get_config():
    return _in_memory_config.get("config", {
        "sending_domain": "outbound.acmesaas.com",
        "daily_sending_limit": 200,
        "warmup_enabled": True,
        "reply_to_email": "growth@acmesaas.com"
    })


@router.post("/config")
async def update_config(payload: EmailConfigSchema = Body(...)):
    _in_memory_config["config"] = payload.model_dump()
    return {"status": "success", "config": _in_memory_config["config"]}


@router.get("/stats")
async def get_stats():
    return EmailAgentService.get_user_stats()
