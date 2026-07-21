import importlib.util
import os
from typing import Any
from fastapi import APIRouter, Body

_dir = os.path.dirname(__file__)
_schemas_path = os.path.join(_dir, "schemas.py")
_spec_s = importlib.util.spec_from_file_location("ig_schemas", _schemas_path)
_mod_s = importlib.util.module_from_spec(_spec_s)
_spec_s.loader.exec_module(_mod_s)
InstagramConfigSchema = _mod_s.InstagramConfigSchema

_service_path = os.path.join(_dir, "service.py")
_spec_srv = importlib.util.spec_from_file_location("ig_service", _service_path)
_mod_srv = importlib.util.module_from_spec(_spec_srv)
_spec_srv.loader.exec_module(_mod_srv)
InstagramAgentService = _mod_srv.InstagramAgentService

router = APIRouter(prefix="/agents/instagram-agent", tags=["user-instagram-agent"])

_in_memory_config: dict[str, Any] = {}


@router.get("/config")
async def get_config():
    return _in_memory_config.get("config", {
        "content_pillars": ["Reels & Shorts", "Product Showcases"],
        "visual_style": "Aesthetic Minimalist",
        "hashtag_count": 15,
        "auto_post_reels": False
    })


@router.post("/config")
async def update_config(payload: InstagramConfigSchema = Body(...)):
    _in_memory_config["config"] = payload.model_dump()
    return {"status": "success", "config": _in_memory_config["config"]}


@router.get("/stats")
async def get_stats():
    return InstagramAgentService.get_user_stats()
