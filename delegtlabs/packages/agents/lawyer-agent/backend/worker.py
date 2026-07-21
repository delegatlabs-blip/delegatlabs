import asyncio
import logging
from datetime import datetime, date
from typing import Any

logger = logging.getLogger("worker.lawyer_agent")


async def run_agent_task(client_agent_id: str | None = None, config: dict[str, Any] | None = None) -> dict[str, Any]:
    """Daily metrics rollup — drafting itself is request-driven via generate-draft."""
    return await run_lawyer_agent_task(client_agent_id=client_agent_id, config=config)


async def run_lawyer_agent_task(
    client_agent_id: str | None = None, config: dict[str, Any] | None = None
) -> dict[str, Any]:
    logger.info("Starting Lawyer Agent metrics rollup for client_agent_id: %s", client_agent_id)
    await asyncio.sleep(0)

    run_record = {
        "client_agent_id": client_agent_id or "seeded-lawyer-client-agent",
        "run_type": "metrics_rollup",
        "status": "success",
        "started_at": datetime.now().isoformat(),
        "finished_at": datetime.now().isoformat(),
        "output_summary": {
            "note": "Drafting is request-driven; worker only rolls up daily metrics.",
            "jurisdiction": (config or {}).get("jurisdiction", "Uttar Pradesh"),
        },
        "error_message": None,
    }

    today_metric = {
        "metric_date": date.today().isoformat(),
        "metric_name": "drafts_generated",
        "metric_value": 0,
    }

    return {"run": run_record, "daily_metric": today_metric}
