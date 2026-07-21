import asyncio
from datetime import datetime, date
import logging

logger = logging.getLogger("worker.email_agent")


async def run_email_job(client_agent_id: str | None = None):
    logger.info("Executing Outbound Email Agent Job...")
    await asyncio.sleep(0.1)

    return {
        "run": {
            "client_agent_id": client_agent_id or "email-seeded-123",
            "run_type": "sequence_dispatch",
            "status": "success",
            "started_at": datetime.now().isoformat(),
            "output_summary": {"emails_sent": 50, "replies_parsed": 4}
        },
        "daily_metric": {
            "metric_date": date.today().isoformat(),
            "metric_name": "emails_sent",
            "metric_value": 50
        }
    }
