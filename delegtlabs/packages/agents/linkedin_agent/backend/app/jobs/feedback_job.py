import logging
from app.services.feedback import run_nightly_feedback

logger = logging.getLogger(__name__)

async def run_feedback_job() -> None:
    logger.info("[FeedbackJob] Starting nightly engagement ingestion...")
    try:
        result = await run_nightly_feedback()
        logger.info(f"[FeedbackJob] Done. Attempted: {result['attempted']}, API succeeded: {result['succeeded']}")
        if result["attempted"] > result["succeeded"]:
            logger.info(f"[FeedbackJob] {result['attempted'] - result['succeeded']} post(s) still need manual engagement entry")
    except Exception as err:
        logger.error(f"[FeedbackJob] Fatal error: {err}")
