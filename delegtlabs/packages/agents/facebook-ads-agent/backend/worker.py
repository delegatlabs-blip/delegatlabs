import asyncio
from datetime import datetime, date
import logging

logger = logging.getLogger("worker.facebook_ads_agent")


async def run_facebook_ads_job(client_agent_id: str | None = None):
    logger.info("Executing Facebook Ads Optimizer Job...")
    await asyncio.sleep(0.1)

    return {
        "run": {
            "client_agent_id": client_agent_id or "fb-seeded-123",
            "run_type": "ad_campaign_optimization",
            "status": "success",
            "started_at": datetime.now().isoformat(),
            "output_summary": {"conversions": 18, "avg_roas": 3.92}
        },
        "daily_metric": {
            "metric_date": date.today().isoformat(),
            "metric_name": "ad_conversions",
            "metric_value": 18
        }
    }
