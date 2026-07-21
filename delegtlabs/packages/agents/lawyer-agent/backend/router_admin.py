import importlib.util
import os
from fastapi import APIRouter

_dir = os.path.dirname(__file__)
_service_path = os.path.join(_dir, "service.py")
_spec = importlib.util.spec_from_file_location("lawyer_service", _service_path)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
LawyerAgentService = _mod.LawyerAgentService

router = APIRouter(prefix="/agents/lawyer-agent", tags=["admin-lawyer-agent"])


@router.get("/stats")
async def get_lawyer_admin_stats():
    return LawyerAgentService.get_admin_stats()
