import importlib.util
import os
from fastapi import APIRouter

_dir = os.path.dirname(__file__)
_service_path = os.path.join(_dir, "service.py")
_spec = importlib.util.spec_from_file_location("ig_service", _service_path)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
InstagramAgentService = _mod.InstagramAgentService

router = APIRouter(prefix="/agents/instagram-agent", tags=["admin-instagram-agent"])


@router.get("/stats")
async def get_instagram_admin_stats():
    return InstagramAgentService.get_admin_stats()
