import importlib.util
import os
from typing import Any
import httpx
from fastapi import APIRouter, Body, Query, Request, Response, HTTPException
from fastapi.responses import JSONResponse

_dir = os.path.dirname(__file__)

_schemas_path = os.path.join(_dir, "schemas.py")
_spec_s = importlib.util.spec_from_file_location("linkedin_schemas", _schemas_path)
_mod_s = importlib.util.module_from_spec(_spec_s)
_spec_s.loader.exec_module(_mod_s)
LinkedInPostConfig = _mod_s.LinkedInPostConfig
GeneratePostRequest = _mod_s.GeneratePostRequest

_service_path = os.path.join(_dir, "service.py")
_spec_srv = importlib.util.spec_from_file_location("linkedin_service", _service_path)
_mod_srv = importlib.util.module_from_spec(_spec_srv)
_spec_srv.loader.exec_module(_mod_srv)
LinkedInAgentService = _mod_srv.LinkedInAgentService
SIDECAR_URL = _mod_srv.SIDECAR_URL
_SIDECAR_HEADERS = _mod_srv._SIDECAR_HEADERS

router = APIRouter(prefix="/agents/linkedin-agent", tags=["user-linkedin-agent"])

_in_memory_config: dict[str, Any] = {}
_DEFAULT_CONFIG = {
    "content_pillars": ["Industry Insights", "Product Updates", "Thought Leadership"],
    "topic_weights": {"product_updates": 0.30, "industry_news": 0.35, "thought_leadership": 0.35},
    "tone": "professional",
    "posting_frequency": "3x_week",
    "approval_required": True,
    "post_length": "medium",
    "hashtag_count": 4,
    "auto_publish_enabled": False,
}


async def _proxy(method: str, path: str, **kwargs) -> dict:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await getattr(client, method)(
                f"{SIDECAR_URL}{path}",
                headers=_SIDECAR_HEADERS,
                **kwargs,
            )
            if res.status_code >= 400:
                raise HTTPException(status_code=res.status_code, detail=res.text)
            return res.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"LinkedIn agent service unavailable: {e}")


@router.get("/stats")
async def get_stats():
    return await LinkedInAgentService.get_user_stats()


@router.get("/config")
async def get_config():
    return _in_memory_config.get("config", _DEFAULT_CONFIG)


@router.post("/config")
async def update_config(payload: LinkedInPostConfig = Body(...)):
    _in_memory_config["config"] = payload.model_dump()
    return {"status": "success", "config": _in_memory_config["config"]}


@router.post("/generate")
async def generate_post(payload: GeneratePostRequest = Body(...)):
    return await _proxy(
        "post",
        "/posts/generate",
        json=payload.model_dump(exclude_none=True),
    )


@router.get("/posts")
async def list_posts(
    status: str = Query(None),
    limit: int = Query(20),
    offset: int = Query(0),
):
    params: dict[str, Any] = {"limit": limit, "offset": offset}
    if status:
        params["status"] = status
    return await _proxy("get", "/posts", params=params)


@router.post("/posts/{post_id}/approve")
async def approve_post(post_id: int):
    return await _proxy("post", f"/posts/{post_id}/approve")


@router.post("/posts/{post_id}/reject")
async def reject_post(post_id: int, body: dict = Body(default={})):
    return await _proxy("post", f"/posts/{post_id}/reject", json=body)


@router.post("/posts/{post_id}/publish")
async def publish_post(post_id: int):
    return await _proxy("post", f"/posts/{post_id}/publish")


@router.get("/performance")
async def get_performance():
    return await _proxy("get", "/performance/summary")


@router.get("/settings")
async def get_settings():
    return await _proxy("get", "/settings")


@router.patch("/settings/{key}")
async def update_setting(key: str, body: dict = Body(...)):
    return await _proxy("patch", f"/settings/{key}", json=body)


@router.get("/topics")
async def list_topics():
    return await _proxy("get", "/topics")


@router.get("/linkedin/connect")
async def linkedin_connect():
    return await _proxy("get", "/auth/linkedin/connect")


@router.get("/onboarding")
async def get_onboarding():
    return await _proxy("get", "/onboarding")
