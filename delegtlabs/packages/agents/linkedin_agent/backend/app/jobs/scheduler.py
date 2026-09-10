import logging
import os
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.core.database import execute_one_raw
from app.jobs.publish_job import run_publish_job
from app.jobs.feedback_job import run_feedback_job
from app.jobs.generate_job import run_generate_tick

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def get_setting_value(key: str, fallback: str) -> str:
    sql = "SELECT value FROM settings WHERE key = :key"
    row = await execute_one_raw(sql, {"key": key})
    return row["value"] if row and row.get("value") else fallback

async def start_scheduler() -> None:
    if os.environ.get("DISABLE_SCHEDULER", "false").lower() == "true":
        logger.info("[Scheduler] DISABLE_SCHEDULER=true — skipping scheduler startup (platform worker manages scheduling)")
        return
    interval_mins = await get_setting_value("publish_cron_interval", "5")
    try:
        mins = int(interval_mins)
    except ValueError:
        mins = 5

    logger.info(f"[Scheduler] Publish job running every {mins} minutes")
    scheduler.add_job(
        run_publish_job,
        trigger=CronTrigger(minute=f"*/{mins}"),
        id="publish_job",
        replace_existing=True,
    )

    feedback_hour = await get_setting_value("feedback_cron_hour", "2")
    try:
        hour = int(feedback_hour)
    except ValueError:
        hour = 2

    logger.info(f"[Scheduler] Feedback job running nightly at {hour}:00 UTC")
    scheduler.add_job(
        run_feedback_job,
        trigger=CronTrigger(hour=hour, minute=0),
        id="feedback_job",
        replace_existing=True,
    )

    logger.info("[Scheduler] Generate job running hourly at minute 0 UTC")
    scheduler.add_job(
        run_generate_tick,
        trigger=CronTrigger(minute=0, timezone="UTC"),
        id="generate_job",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("[Scheduler] All jobs started ✓")

def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] All jobs stopped")
