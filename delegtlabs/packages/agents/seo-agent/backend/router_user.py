import importlib.util
import os
from typing import Any
from fastapi import APIRouter, Body

_dir = os.path.dirname(__file__)
_schemas_path = os.path.join(_dir, "schemas.py")
_spec_s = importlib.util.spec_from_file_location("seo_schemas", _schemas_path)
_mod_s = importlib.util.module_from_spec(_spec_s)
_spec_s.loader.exec_module(_mod_s)
SEOConfigSchema = _mod_s.SEOConfigSchema

_service_path = os.path.join(_dir, "service.py")
_spec_srv = importlib.util.spec_from_file_location("seo_service", _service_path)
_mod_srv = importlib.util.module_from_spec(_spec_srv)
_spec_srv.loader.exec_module(_mod_srv)
SEOAgentService = _mod_srv.SEOAgentService

router = APIRouter(prefix="/agents/seo-agent", tags=["user-seo-agent"])

_in_memory_config: dict[str, Any] = {}


@router.get("/config")
async def get_config():
    return _in_memory_config.get("config", {
        "target_keywords": ["AI agents platform", "B2B SaaS automation"],
        "website_url": "https://acmesaas.com",
        "target_search_engine": "Google US",
        "target_article_length": 1800,
        "auto_publish_wordpress": False
    })


@router.post("/config")
async def update_config(payload: SEOConfigSchema = Body(...)):
    _in_memory_config["config"] = payload.model_dump()
    return {"status": "success", "config": _in_memory_config["config"]}


@router.get("/stats")
async def get_stats():
    return SEOAgentService.get_user_stats()
