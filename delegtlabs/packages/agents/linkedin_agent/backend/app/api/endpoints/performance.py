from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import require_auth
from app.core.database import execute_raw, execute_one_raw
from app.schemas.performance import ManualEngagementRequest
from app.services.feedback import record_engagement

router = APIRouter(prefix="/performance", tags=["performance"], dependencies=[Depends(require_auth)])

@router.get("/summary")
async def get_performance_summary():
    topic_summary_sql = """
    SELECT
       t.id,
       t.name,
       t.slug,
       t.weight,
       COUNT(p.id) FILTER (WHERE p.status = 'published') as published_count,
       ROUND(AVG(pp.score)::numeric, 2) as avg_score,
       ROUND(MAX(pp.score)::numeric, 2) as max_score,
       SUM(pp.likes) as total_likes,
       SUM(pp.comments) as total_comments,
       SUM(pp.shares) as total_shares
     FROM topics t
     LEFT JOIN posts p ON p.topic_id = t.id
     LEFT JOIN post_performance pp ON pp.post_id = p.id
     GROUP BY t.id, t.name, t.slug, t.weight
     ORDER BY avg_score DESC NULLS LAST
    """
    topic_summary = await execute_raw(topic_summary_sql)

    time_series_sql = """
    SELECT
       t.slug as topic_slug,
       t.name as topic_name,
       DATE_TRUNC('week', pp.recorded_at) as week,
       ROUND(AVG(pp.score)::numeric, 2) as avg_score,
       COUNT(*) as data_points
     FROM post_performance pp
     JOIN posts p ON pp.post_id = p.id
     JOIN topics t ON p.topic_id = t.id
     WHERE pp.recorded_at > NOW() - INTERVAL '12 weeks'
     GROUP BY t.slug, t.name, DATE_TRUNC('week', pp.recorded_at)
     ORDER BY week DESC, topic_slug
    """
    time_series = await execute_raw(time_series_sql)

    recent_posts_sql = """
    SELECT
       p.id,
       p.generated_text,
       p.published_at,
       p.linkedin_post_urn,
       t.name as topic_name,
       t.slug as topic_slug,
       pp.likes,
       pp.comments,
       pp.shares,
       pp.score,
       pp.source as data_source,
       pp.recorded_at as score_recorded_at
     FROM posts p
     LEFT JOIN topics t ON p.topic_id = t.id
     LEFT JOIN LATERAL (
       SELECT * FROM post_performance
       WHERE post_id = p.id
       ORDER BY recorded_at DESC
       LIMIT 1
     ) pp ON true
     WHERE p.status = 'published'
     ORDER BY p.published_at DESC
     LIMIT 50
    """
    recent_posts = await execute_raw(recent_posts_sql)

    return {
        "topicSummary": topic_summary,
        "timeSeries": time_series,
        "recentPosts": recent_posts
    }

@router.post("/manual")
async def record_manual_performance(body: ManualEngagementRequest):
    if not body.postId:
        raise HTTPException(status_code=400, detail="postId is required")

    post = await execute_one_raw("SELECT id, topic_id, status FROM posts WHERE id = :id", {"id": body.postId})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    ok = await record_engagement(
        post_id=body.postId,
        topic_id=post.get("topic_id"),
        likes=body.likes,
        comments=body.comments,
        shares=body.shares,
        impressions=body.impressions or 0,
        source="manual"
    )

    return {"ok": ok, "message": "Engagement recorded and topic weight updated"}
