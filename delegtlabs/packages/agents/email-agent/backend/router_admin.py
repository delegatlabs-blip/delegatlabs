import importlib.util
import os
from fastapi import APIRouter

_dir = os.path.dirname(__file__)
_service_path = os.path.join(_dir, "service.py")
_spec = importlib.util.spec_from_file_location("email_service", _service_path)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
EmailAgentService = _mod.EmailAgentService

router = APIRouter(prefix="/agents/email-agent", tags=["admin-email-agent"])


@router.get("/stats")
async def get_email_admin_stats():
    return EmailAgentService.get_admin_stats()
