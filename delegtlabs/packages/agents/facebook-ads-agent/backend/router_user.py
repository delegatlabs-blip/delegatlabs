import importlib.util
import os
from typing import Any
from fastapi import APIRouter, Body

_dir = os.path.dirname(__file__)
_schemas_path = os.path.join(_dir, "schemas.py")
_spec_s = importlib.util.spec_from_file_location("fb_schemas", _schemas_path)
_mod_s = importlib.util.module_from_spec(_spec_s)
_spec_s.loader.exec_module(_mod_s)
FacebookAdsConfigSchema = _mod_s.FacebookAdsConfigSchema

_service_path = os.path.join(_dir, "service.py")
_spec_srv = importlib.util.spec_from_file_location("fb_service", _service_path)
_mod_srv = importlib.util.module_from_spec(_spec_srv)
_spec_srv.loader.exec_module(_mod_srv)
FacebookAdsAgentService = _mod_srv.FacebookAdsAgentService

router = APIRouter(prefix="/agents/facebook-ads-agent", tags=["user-facebook-ads-agent"])

_in_memory_config: dict[str, Any] = {}


@router.get("/config")
async def get_config():
    return _in_memory_config.get("config", {
        "monthly_budget_usd": 2000.0,
        "target_roas": 3.5,
        "target_countries": ["US", "CA"],
        "ad_copy_tone": "High Energy",
        "retargeting_enabled": True
    })


@router.post("/config")
async def update_config(payload: FacebookAdsConfigSchema = Body(...)):
    _in_memory_config["config"] = payload.model_dump()
    return {"status": "success", "config": _in_memory_config["config"]}


@router.get("/stats")
async def get_stats():
    return FacebookAdsAgentService.get_user_stats()
