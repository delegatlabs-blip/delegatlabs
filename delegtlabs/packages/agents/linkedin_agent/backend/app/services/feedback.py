import logging
from typing import Dict, Any, Optional
from app.core.database import execute_raw, execute_one_raw
from app.services.linkedin import get_post_engagement

logger = logging.getLogger(__name__)

TYPICAL_MAX = 100

def compute_score(likes: int, comments: int, shares: int) -> float:
    raw = likes + comments * 2 + shares * 3
    return min(100.0, (raw / TYPICAL_MAX) * 100)

async def update_topic_weight(topic_id: int, score: float) -> None:
    normalized_score = score / 100.0
    sql = """
    UPDATE topics
    SET weight = GREATEST(0.05, LEAST(1.0, 0.7 * weight + 0.3 * :score)),
        updated_at = NOW()
    WHERE id = :topic_id
    """
    await execute_raw(sql, {"score": normalized_score, "topic_id": topic_id})

async def record_engagement(
    post_id: int,
    topic_id: Optional[int],
    likes: int,
    comments: int,
    shares: int,
    impressions: int = 0,
    source: str = "manual"
) -> bool:
    score = compute_score(likes, comments, shares)

    sql = """
    INSERT INTO post_performance (post_id, likes, comments, shares, impressions, score, source, recorded_at)
    VALUES (:post_id, :likes, :comments, :shares, :impressions, :score, :source::performance_source, NOW())
    """
    await execute_raw(sql, {
        "post_id": post_id,
        "likes": likes,
        "comments": comments,
        "shares": shares,
        "impressions": impressions,
        "score": score,
        "source": source
    })

    if topic_id:
        await update_topic_weight(topic_id, score)

    return True

async def ingest_engagement(post_id: int) -> bool:
    sql = "SELECT id, topic_id, linkedin_post_urn FROM posts WHERE id = :id"
    post = await execute_one_raw(sql, {"id": post_id})
    if not post or not post.get("linkedin_post_urn"):
        return False

    engagement = await get_post_engagement(post["linkedin_post_urn"])
    if not engagement:
        return False

    return await record_engagement(
        post_id=post_id,
        topic_id=post.get("topic_id"),
        likes=engagement["likes"],
        comments=engagement["comments"],
        shares=engagement["shares"],
        impressions=engagement.get("impressions", 0),
        source="api"
    )

async def run_nightly_feedback() -> Dict[str, int]:
    sql = """
    SELECT p.id, p.linkedin_post_urn
    FROM posts p
    WHERE p.status = 'published'
      AND p.published_at < NOW() - INTERVAL '24 hours'
      AND p.published_at > NOW() - INTERVAL '7 days'
      AND p.linkedin_post_urn IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM post_performance pp
        WHERE pp.post_id = p.id
          AND pp.source = 'api'
          AND pp.recorded_at > NOW() - INTERVAL '24 hours'
      )
    """
    posts = await execute_raw(sql)
    succeeded = 0
    for post in posts:
        try:
            ok = await ingest_engagement(post["id"])
            if ok:
                succeeded += 1
        except Exception as e:
            logger.error(f"[Feedback] Failed for post {post['id']}: {e}")

    logger.info(f"[Feedback] Attempted: {len(posts)}, Succeeded: {succeeded}")
    return {"attempted": len(posts), "succeeded": succeeded}
