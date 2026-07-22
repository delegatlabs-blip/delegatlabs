import importlib.util
import os
import uuid
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Body

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

_worker_path = os.path.join(_dir, "worker.py")
_spec_w = importlib.util.spec_from_file_location("linkedin_worker", _worker_path)
_mod_w = importlib.util.module_from_spec(_spec_w)
_spec_w.loader.exec_module(_mod_w)
run_linkedin_agent_task = _mod_w.run_linkedin_agent_task

router = APIRouter(prefix="/agents/linkedin-agent", tags=["user-linkedin-agent"])

_DEFAULT_CONFIG: dict[str, Any] = {
    "lead_gen": {
        "target_job_titles": ["VP Marketing", "Chief Marketing Officer"],
        "industries": ["Software", "Internet"],
        "company_size": ["51-200 employees"],
        "geography": ["United States", "India"],
        "score_threshold": 70,
        "connection_message_template": "Hi {{first_name}}, let's connect!",
        "daily_connection_cap": 25,
    },
    "post_gen": {
        "content_pillars": ["B2B SaaS Growth", "AI Automation"],
        "topic_weights": {
            "product_updates": 0.3,
            "industry_news": 0.35,
            "thought_leadership": 0.35,
        },
        "news_sources": [
            "https://techcrunch.com/feed/",
            "https://www.theverge.com/rss/index.xml",
        ],
        "tone": "Professional",
        "posting_frequency": "3x_per_week",
        "approval_mode": "review_first",
    },
}

_in_memory_config: dict[str, Any] = {"config": dict(_DEFAULT_CONFIG)}
_in_memory_credentials: dict[str, Any] = {
    "linkedin": True,
    "openai": True,
    "rss": True,
}


def _next_run_from_cron() -> str:
    """Next boundary for cron `0 */6 * * *` (every 6 hours on the hour)."""
    now = datetime.utcnow()
    hour_block = ((now.hour // 6) + 1) * 6
    if hour_block >= 24:
        nxt = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        nxt = now.replace(hour=hour_block, minute=0, second=0, microsecond=0)
    return nxt.isoformat() + "Z"


@router.get("/config")
async def get_config():
    return _in_memory_config.get("config", _DEFAULT_CONFIG)


@router.post("/config")
async def update_config(payload: LinkedInAgentConfigSchema = Body(...)):
    _in_memory_config["config"] = payload.model_dump()
    return {"status": "success", "config": _in_memory_config["config"]}


@router.get("/stats")
async def get_stats():
    stats = LinkedInAgentService.get_user_stats()
    stats["next_run_at"] = _next_run_from_cron()
    stats["credentials"] = [
        {
            "provider": "linkedin",
            "label": "LinkedIn OAuth",
            "status": "connected" if _in_memory_credentials.get("linkedin") else "missing",
        },
        {
            "provider": "openai",
            "label": "OpenAI",
            "status": "connected" if _in_memory_credentials.get("openai") else "missing",
        },
        {
            "provider": "rss",
            "label": "RSS Feeds",
            "status": "connected" if _in_memory_credentials.get("rss") else "missing",
        },
    ]
    return stats


@router.get("/credentials")
async def get_credentials():
    return {
        "credentials": [
            {"provider": k, "status": "connected" if v else "missing"}
            for k, v in _in_memory_credentials.items()
        ]
    }


@router.post("/run")
async def trigger_pipeline(run_type: str = "full"):
    """Manual worker trigger — runs LinkedIn PR + lead pipeline once."""
    started = datetime.utcnow()
    result = await run_linkedin_agent_task(
        client_agent_id="seeded-client-agent-123",
        config=_in_memory_config.get("config"),
    )
    finished = datetime.utcnow()
    run = result.get("run", {})
    run_record = {
        "id": str(uuid.uuid4()),
        "client_agent_id": run.get("client_agent_id"),
        "run_type": run_type if run_type != "full" else run.get("run_type", "pipeline"),
        "status": run.get("status", "success"),
        "started_at": started.isoformat() + "Z",
        "finished_at": finished.isoformat() + "Z",
        "duration_ms": int((finished - started).total_seconds() * 1000),
        "output_summary": run.get("output_summary"),
        "error_message": run.get("error_message"),
    }
    LinkedInAgentService.record_run(run_record)
    return {"status": "queued", "run": run_record, "daily_metric": result.get("daily_metric")}


@router.get("/connect")
async def oauth_connect():
    return {
        "redirect_url": (
            "https://www.linkedin.com/oauth/v2/authorization"
            "?response_type=code&client_id=mock_client"
            "&redirect_uri=http://localhost:3002/callback&scope=r_liteprofile%20w_member_social"
        )
    }


@router.get("/callback")
async def oauth_callback(code: str = "mock_code"):
    _in_memory_credentials["linkedin"] = True
    return {"status": "connected", "provider": "linkedin", "code": code}
