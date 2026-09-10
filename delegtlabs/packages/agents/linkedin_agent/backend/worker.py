import asyncio
import logging
import os
from datetime import datetime, date
from typing import Any
import uuid

import httpx

logger = logging.getLogger("worker.linkedin_agent")

SIDECAR_URL = os.environ.get("LINKEDIN_SIDECAR_URL", "http://localhost:8005")
SERVICE_TOKEN = os.environ.get("LINKEDIN_SERVICE_TOKEN", "")
_HEADERS = {"X-Service-Token": SERVICE_TOKEN} if SERVICE_TOKEN else {}


async def run_agent_task(client_agent_id: str | None = None, config: dict[str, Any] | None = None) -> dict[str, Any]:
    """Metrics-only rollup — content generation is handled by the standalone APScheduler."""
    return await _linkedin_metrics_rollup(client_agent_id=client_agent_id, config=config)


async def _linkedin_metrics_rollup(
    client_agent_id: str | None = None,
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    logger.info("[LinkedInWorker] Starting metrics rollup for client_agent_id=%s", client_agent_id)
    await asyncio.sleep(0)

    posts_count = 0
    pending_count = 0
    error_message = None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            perf_res = await client.get(
                f"{SIDECAR_URL}/performance/summary",
                headers=_HEADERS,
            )
            posts_res = await client.get(
                f"{SIDECAR_URL}/posts",
                params={"status": "published", "limit": 100},
                headers=_HEADERS,
            )
            pending_res = await client.get(
                f"{SIDECAR_URL}/posts",
                params={"status": "pending_review", "limit": 100},
                headers=_HEADERS,
            )

        published = posts_res.json() if posts_res.status_code == 200 else []
        pending = pending_res.json() if pending_res.status_code == 200 else []

        if isinstance(published, dict):
            published = published.get("items", published.get("posts", []))
        if isinstance(pending, dict):
            pending = pending.get("items", pending.get("posts", []))

        posts_count = len(published)
        pending_count = len(pending)
    except Exception as e:
        error_message = str(e)
        logger.error("[LinkedInWorker] Sidecar call failed: %s", e)

    run_record = {
        "client_agent_id": client_agent_id or "seeded-linkedin-client-agent",
        "run_type": "metrics_rollup",
        "status": "success" if not error_message else "failed",
        "started_at": datetime.now().isoformat(),
        "finished_at": datetime.now().isoformat(),
        "output_summary": {
            "note": "Content generation is handled by standalone APScheduler; worker only rolls up metrics.",
            "posts_published_total": posts_count,
            "posts_pending_approval": pending_count,
        },
        "error_message": error_message,
    }

    today_metric = {
        "metric_date": date.today().isoformat(),
        "metric_name": "posts_published",
        "metric_value": float(posts_count),
    }

    return {"run": run_record, "daily_metric": today_metric}
