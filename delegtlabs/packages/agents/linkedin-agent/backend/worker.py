import asyncio
from datetime import datetime, date
import logging
from typing import Any

logger = logging.getLogger("worker.linkedin_agent")


async def run_linkedin_agent_task(client_agent_id: str | None = None, config: dict[str, Any] | None = None) -> dict[str, Any]:
    logger.info(f"Starting LinkedIn Agent Worker run for client_agent_id: {client_agent_id}")

    current_config = config or {
        "lead_gen": {"daily_connection_cap": 20},
        "post_gen": {"approval_mode": "review_first"}
    }

    approval_mode = current_config.get("post_gen", {}).get("approval_mode", "review_first")
    target_titles = current_config.get("lead_gen", {}).get("target_job_titles", ["VP Marketing"])

    # Simulate AI lead generation & post generation
    await asyncio.sleep(0.1)

    leads_generated = len(target_titles) * 5
    posts_created = 1

    if approval_mode == "auto_publish":
        post_status = "published"
        action_note = "Published directly to LinkedIn feed via API"
    else:
        post_status = "draft"
        action_note = "Generated draft post & notified user for review"

    run_record = {
        "client_agent_id": client_agent_id or "seeded-client-agent-123",
        "run_type": "post_generation_and_lead_outreach",
        "status": "success",
        "started_at": datetime.now().isoformat(),
        "finished_at": datetime.now().isoformat(),
        "output_summary": {
            "leads_generated": leads_generated,
            "posts_created": posts_created,
            "post_status": post_status,
            "note": action_note
        },
        "error_message": None
    }

    today_metric = {
        "metric_date": date.today().isoformat(),
        "metric_name": "leads_generated",
        "metric_value": leads_generated
    }

    logger.info(f"LinkedIn Agent Worker run completed successfully: {run_record['output_summary']}")
    return {
        "run": run_record,
        "daily_metric": today_metric
    }
