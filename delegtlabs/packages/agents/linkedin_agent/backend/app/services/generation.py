import random
import json
import logging
from datetime import date, datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException
from app.core.database import AsyncSessionLocal, execute_raw, execute_one_raw, execute_raw_on_session
from app.services.gemini import generate_post, derive_image_prompt
from app.services.grok import generate_and_store_image
from app.services.compliance import get_effective_agent_config, compliance_prompt_block
from app.services.audit import DEFAULT_TENANT_ID

logger = logging.getLogger(__name__)

def _selected_option_label(row: Dict[str, Any]) -> Optional[str]:
    value = row.get("selected_option")
    options = row.get("options")
    if isinstance(options, str):
        try:
            options = json.loads(options)
        except Exception:
            options = []
    if not isinstance(options, list) or value is None:
        return None
    for opt in options:
        if isinstance(opt, dict) and opt.get("value") == value:
            label = opt.get("label")
            return label if isinstance(label, str) else None
    return None


def _with_option_label(topic: Dict[str, Any]) -> Dict[str, Any]:
    topic["selected_option_label"] = _selected_option_label(topic)
    return topic


async def _catalog_predicate(tenant_id: Optional[str]) -> tuple:
    if not tenant_id:
        return "FALSE", {}
    replaced = await execute_one_raw(
        "SELECT tenant_id FROM tenant_topic_replacements WHERE tenant_id = :tid",
        {"tid": tenant_id},
    )
    if replaced:
        return "tenant_id = :tid", {"tid": tenant_id}
    return "FALSE", {}


async def select_topic(
    topic_id: Optional[int] = None,
    tenant_id: Optional[str] = None,
) -> Dict[str, Any]:
    pred, params = await _catalog_predicate(tenant_id)
    if pred == "FALSE":
        if topic_id:
            raise HTTPException(status_code=404, detail=f"Topic {topic_id} not found or inactive")
        raise HTTPException(status_code=404, detail="No active topics found")
    cols = "id, name, slug, weight, selected_option, options"

    if topic_id:
        params = {**params, "id": topic_id}
        sql = f"SELECT {cols} FROM topics WHERE id = :id AND is_active = true AND {pred}"
        topic = await execute_one_raw(sql, params)
        if not topic:
            raise HTTPException(status_code=404, detail=f"Topic {topic_id} not found or inactive")
        return _with_option_label(topic)

    sql = f"SELECT {cols} FROM topics WHERE is_active = true AND {pred}"
    topics = await execute_raw(sql, params)
    if not topics:
        raise HTTPException(status_code=404, detail="No active topics found")

    total_weight = sum(float(t["weight"]) for t in topics)
    r = random.uniform(0, total_weight)

    for t in topics:
        r -= float(t["weight"])
        if r <= 0:
            return _with_option_label(t)

    return _with_option_label(topics[-1])

async def load_settings() -> Dict[str, Any]:
    sql = "SELECT key, value FROM settings WHERE key IN ('default_tone', 'post_length', 'hashtag_count', 'onboarding_answers')"
    rows = await execute_raw(sql)
    settings_map = {r["key"]: r["value"] for r in rows}

    onboarding_answers = None
    if "onboarding_answers" in settings_map:
        try:
            onboarding_answers = json.loads(settings_map["onboarding_answers"])
        except Exception:
            pass

    return {
        "default_tone": settings_map.get("default_tone", "casual"),
        "post_length": settings_map.get("post_length", "medium"),
        "hashtag_count": settings_map.get("hashtag_count", "4"),
        "onboarding_answers": onboarding_answers,
    }

async def build_performance_context(topic_id: int) -> Optional[str]:
    sql = """
    SELECT pp.score, pp.recorded_at, pp.likes, pp.comments, pp.shares
    FROM post_performance pp
    JOIN posts p ON pp.post_id = p.id
    WHERE p.topic_id = :topic_id
    ORDER BY pp.recorded_at DESC
    LIMIT 5
    """
    recent_perf = await execute_raw(sql, {"topic_id": topic_id})
    if not recent_perf:
        return None

    scores = [float(r["score"] or 0) for r in recent_perf]
    likes = [int(r["likes"]) for r in recent_perf]
    comments = [int(r["comments"]) for r in recent_perf]

    avg_score = sum(scores) / len(scores)
    avg_likes = sum(likes) / len(likes)
    avg_comments = sum(comments) / len(comments)

    return f"Recent performance for this topic (last {len(recent_perf)} posts): avg score {avg_score:.1f}, avg likes {avg_likes:.0f}, avg comments {avg_comments:.0f}."

async def load_content_dna(tenant_id: Optional[str]):
    if not tenant_id:
        return None
    try:
        from app.services.adaptive_onboarding.persistence import load_state

        state = await load_state(tenant_id)
        if not state:
            return None
        return state[0]
    except Exception:
        logger.warning("[Generation] Could not load Content DNA for tenant")
        return None


def _quota_period_start(quota_slot: str, now_utc: datetime) -> date:
    now = now_utc.astimezone(timezone.utc) if now_utc.tzinfo else now_utc.replace(tzinfo=timezone.utc)
    if quota_slot == "weekly_image":
        return (now - timedelta(days=now.weekday())).date()
    return now.date()


async def run_generation_pipeline(
    topic_id: Optional[int] = None,
    source_url: Optional[str] = None,
    onboarding_answers: Optional[Dict[str, Any]] = None,
    tenant_id: Optional[str] = None,
    skip_image: bool = False,
    quota_slot: Optional[str] = None,
) -> Dict[str, Any]:
    logger.info("[Generation] Starting pipeline...")

    # 1. Select topic
    topic = await select_topic(topic_id, tenant_id=tenant_id)
    logger.info(f"[Generation] Selected topic: {topic['name']} ({topic['slug']})")

    # 2. Load settings
    settings = await load_settings()
    answers = onboarding_answers or settings.get("onboarding_answers")
    dna = await load_content_dna(tenant_id)
    content_context = None
    if dna is not None:
        from app.services.adaptive_onboarding.context import build_content_context

        content_context = build_content_context(dna, "write_post")

    # 3. Build performance context
    previous_context = await build_performance_context(topic["id"])

    # 3b. Merge global compliance into post_gen effective config (non-removable)
    effective = await get_effective_agent_config(DEFAULT_TENANT_ID, "post_gen")
    compliance_block = compliance_prompt_block(effective)

    # 4. Generate post text via Gemini
    logger.info("[Generation] Calling Gemini...")
    gen_result = await generate_post(
        topic_slug=topic["slug"],
        topic_name=topic["name"],
        source_url=source_url,
        tone=settings["default_tone"],
        post_length=settings["post_length"],
        hashtag_count=int(settings["hashtag_count"]),
        previous_context=previous_context,
        onboarding_answers=answers,
        compliance_block=compliance_block,
        content_context=content_context,
        topic_option_label=topic.get("selected_option_label"),
    )
    text = gen_result["text"]
    prompt_used = gen_result["promptUsed"]
    logger.info(f"[Generation] Text generated, length: {len(text)}")

    image_prompt = None
    image_url = None
    if not skip_image:
        image_prompt = await derive_image_prompt(text)
        logger.info(f"[Generation] Image prompt: {image_prompt}")
        try:
            logger.info("[Generation] Calling Grok for image...")
            grok_res = await generate_and_store_image(image_prompt)
            image_url = grok_res["supabaseUrl"]
            logger.info(f"[Generation] Image stored: {image_url}")
        except Exception as e:
            logger.error(f"[Generation] Image generation failed (non-fatal): {e}")

    sql = """
    INSERT INTO posts (
      topic_id, source_url, prompt_text, generated_text, image_prompt, image_url,
      status, tenant_id, quota_slot
    )
    VALUES (
      :topic_id, :source_url, :prompt_text, :generated_text, :image_prompt, :image_url,
      'draft', CAST(:tenant_id AS uuid), :quota_slot
    )
    RETURNING *
    """
    params = {
        "topic_id": topic["id"],
        "source_url": source_url,
        "prompt_text": prompt_used,
        "generated_text": text,
        "image_prompt": image_prompt,
        "image_url": image_url,
        "tenant_id": tenant_id,
        "quota_slot": quota_slot,
    }

    async with AsyncSessionLocal() as session:
        try:
            rows = await execute_raw_on_session(session, sql, params)
            if not rows:
                await session.rollback()
                raise HTTPException(status_code=500, detail="Failed to save generated post to database")
            if quota_slot and tenant_id:
                period_start = _quota_period_start(quota_slot, datetime.now(timezone.utc))
                await execute_raw_on_session(
                    session,
                    """
                    INSERT INTO subscription_quota_usage
                      (tenant_id, agent_kind, quota_slot, period_start, used)
                    VALUES
                      (CAST(:tid AS uuid), CAST(:kind AS agent_kind), :slot, CAST(:period_start AS date), 1)
                    ON CONFLICT (tenant_id, agent_kind, quota_slot, period_start)
                    DO UPDATE SET used = subscription_quota_usage.used + 1
                    """,
                    {
                        "tid": tenant_id,
                        "kind": "post_gen",
                        "slot": quota_slot,
                        "period_start": period_start.isoformat(),
                    },
                )
            await session.commit()
            row = rows[0]
        except HTTPException:
            await session.rollback()
            raise
        except Exception:
            await session.rollback()
            raise

    row["topic_name"] = topic["name"]
    row["topic_slug"] = topic["slug"]
    logger.info(f"[Generation] Post saved as draft, id: {row['id']}")
    return row
