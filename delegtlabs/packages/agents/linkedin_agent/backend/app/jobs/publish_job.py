import logging
from app.core.database import execute_raw, execute_one_raw
from app.services.publish import publish_post
from app.services.compliance_gate import ComplianceBlocked

logger = logging.getLogger(__name__)

LINKEDIN_DAILY_POST_LIMIT = 3


async def _daily_published_count() -> int:
    """Count LinkedIn creates (clone/legacy successes with a URN) in the last 24h."""
    sql = """
    SELECT COUNT(*) AS cnt
    FROM posts
    WHERE status = 'published'
      AND linkedin_post_urn IS NOT NULL
      AND published_at >= NOW() - INTERVAL '24 hours'
    """
    row = await execute_one_raw(sql)
    return int(row["cnt"]) if row else 0


async def run_publish_job() -> None:
    daily_count = await _daily_published_count()
    if daily_count >= LINKEDIN_DAILY_POST_LIMIT:
        logger.warning(
            "[PublishJob] Daily LinkedIn post limit reached (%d/%d) — skipping publish run",
            daily_count,
            LINKEDIN_DAILY_POST_LIMIT,
        )
        return

    remaining = LINKEDIN_DAILY_POST_LIMIT - daily_count
    # Only source rows (no destination_id) — clones are fan-out children, not schedule targets.
    sql = f"""
    SELECT id, tenant_id, scheduled_at
    FROM posts
    WHERE status = 'approved'
      AND destination_id IS NULL
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    ORDER BY scheduled_at ASC NULLS FIRST
    LIMIT {remaining}
    """
    due = await execute_raw(sql)
    if not due:
        return

    logger.info(f"[PublishJob] Found {len(due)} post(s) ready to publish ({daily_count}/{LINKEDIN_DAILY_POST_LIMIT} used today)")

    for post in due:
        if post.get("tenant_id") is None:
            logger.info("[PublishJob] Post %s has NULL tenant_id — skip", post["id"])
            continue
        try:
            logger.info(f"[PublishJob] Publishing post {post['id']}...")
            await publish_post(post["id"], tenant_id=str(post["tenant_id"]))
            logger.info(f"[PublishJob] Post {post['id']} published ✓")
        except ComplianceBlocked as blocked:
            # Expected outcome, not a failure: the post is now pending_review and
            # sitting in the admin approvals queue. It leaves the publish queue,
            # so this does not retry on the next run.
            logger.warning(f"[PublishJob] Post {post['id']} held by compliance: {blocked}")
        except Exception as err:
            logger.error(f"[PublishJob] Post {post['id']} failed: {err}")
