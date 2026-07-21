import asyncio
from datetime import datetime, date
import logging

logger = logging.getLogger("worker.instagram_agent")


async def run_instagram_job(client_agent_id: str | None = None):
    logger.info("Executing Instagram Content Creator Job...")
    await asyncio.sleep(0.1)

    return {
        "run": {
            "client_agent_id": client_agent_id or "ig-seeded-123",
            "run_type": "reels_creation",
            "status": "success",
            "started_at": datetime.now().isoformat(),
            "output_summary": {"reels_drafted": 1}
        },
        "daily_metric": {
            "metric_date": date.today().isoformat(),
            "metric_name": "reels_published",
            "metric_value": 1
        }
    }
