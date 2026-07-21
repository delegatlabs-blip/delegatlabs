import importlib.util
import os
from fastapi import APIRouter

_dir = os.path.dirname(__file__)
_service_path = os.path.join(_dir, "service.py")
_spec = importlib.util.spec_from_file_location("fb_service", _service_path)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
FacebookAdsAgentService = _mod.FacebookAdsAgentService

router = APIRouter(prefix="/agents/facebook-ads-agent", tags=["admin-facebook-ads-agent"])


@router.get("/stats")
async def get_facebook_ads_admin_stats():
    return FacebookAdsAgentService.get_admin_stats()
