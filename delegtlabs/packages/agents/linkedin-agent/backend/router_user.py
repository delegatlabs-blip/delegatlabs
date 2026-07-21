import importlib.util
import os
from typing import Any
from fastapi import APIRouter, Body, HTTPException

_dir = os.path.dirname(__file__)
_schemas_path = os.path.join(_dir, "schemas.py")
_spec_s = importlib.util.spec_from_file_location("linkedin_schemas", _schemas_path)
_mod_s = importlib.util.module_from_spec(_spec_s)
_spec_s.loader.exec_module(_mod_s)
LinkedInAgentConfigSchema = _mod_s.LinkedInAgentConfigSchema

_service_path = os.path.join(_dir, "service.py")
_spec_srv = importlib.util.spec_from_file_location("linkedin_service", _service_path)
_mod_srv = importlib.util.module_from_spec(_spec_srv)
_spec_srv.loader.exec_module(_mod_srv)
LinkedInAgentService = _mod_srv.LinkedInAgentService

router = APIRouter(prefix="/agents/linkedin-agent", tags=["user-linkedin-agent"])

# In-memory config store for rapid prototyping / seeded test persistence
_in_memory_config: dict[str, Any] = {}
_in_memory_credentials: dict[str, Any] = {}


@router.get("/config")
async def get_config():
    return _in_memory_config.get("config", {
        "lead_gen": {
            "target_job_titles": ["VP Marketing", "Chief Marketing Officer"],
            "industries": ["Software", "Internet"],
            "company_size": ["51-200 employees"],
            "connection_message_template": "Hi {{first_name}}, let's connect!",
            "daily_connection_cap": 25
        },
        "post_gen": {
            "content_pillars": ["B2B SaaS Growth", "AI Automation"],
            "tone": "Professional",
            "posting_frequency": "3x_per_week",
            "approval_mode": "review_first"
        }
    })


@router.post("/config")
async def update_config(payload: LinkedInAgentConfigSchema = Body(...)):
    _in_memory_config["config"] = payload.model_dump()
    return {"status": "success", "config": _in_memory_config["config"]}


@router.get("/stats")
async def get_stats():
    return LinkedInAgentService.get_user_stats()


@router.get("/connect")
async def oauth_connect():
    return {
        "redirect_url": "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=mock_client&redirect_uri=http://localhost:3000/callback&scope=r_liteprofile%20w_member_social"
    }


@router.get("/callback")
async def oauth_callback(code: str = "mock_code"):
    _in_memory_credentials["connected"] = True
    _in_memory_credentials["provider"] = "linkedin"
    return {"status": "connected", "provider": "linkedin"}
