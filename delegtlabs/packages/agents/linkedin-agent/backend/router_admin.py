import importlib.util
import os
from fastapi import APIRouter

_dir = os.path.dirname(__file__)
_service_path = os.path.join(_dir, "service.py")
_spec = importlib.util.spec_from_file_location("linkedin_service", _service_path)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
LinkedInAgentService = _mod.LinkedInAgentService

router = APIRouter(prefix="/agents/linkedin-agent", tags=["admin-linkedin-agent"])


@router.get("/stats")
async def get_linkedin_admin_stats():
    return LinkedInAgentService.get_admin_stats()
