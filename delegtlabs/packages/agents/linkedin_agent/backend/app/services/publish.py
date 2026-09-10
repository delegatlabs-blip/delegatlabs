"""Multi-destination LinkedIn publish (C-linkedin-multi-publish)."""
from __future__ import annotations

import json
import logging
import time
from typing import Any, Dict, List, Optional

from fastapi import HTTPException

from app.core.database import execute_one_raw, execute_raw
from app.services.audit import DEFAULT_TENANT_ID
from app.services.compliance import get_effective_agent_config, industry_has_pending_review
from app.services.compliance_gate import ComplianceBlocked, record_block, run_compliance_check
from app.services.linkedin import (
    create_linkedin_post,
    download_image_buffer,
    get_stored_account,
    upload_image_to_linkedin,
)
from app.services.linkedin_destinations import list_enabled_publishable

logger = logging.getLogger(__name__)

NO_DESTINATIONS_DETAIL = (
    "No enabled LinkedIn destinations. Enable at least one destination on Connections."
)


async def _hold_for_review(post_id: int, reason: str) -> None:
    await execute_raw(
        """
        UPDATE posts
        SET status = 'pending_review', rejection_reason = :reason, updated_at = NOW()
        WHERE id = :id AND status NOT IN ('published', 'partial')
        """,
        {"id": post_id, "reason": reason[:2000]},
    )


async def _run_compliance(post_id: int, post_text: str) -> str:
    """Run compliance gate; may raise ComplianceBlocked. Returns text to publish."""
    effective = await get_effective_agent_config(DEFAULT_TENANT_ID, "post_gen")
    industry = (effective.get("_compliance") or {}).get("industry")

    if await industry_has_pending_review(industry):
        reason = (
            f"Compliance rules for industry '{industry}' are awaiting admin approval. "
            "Publishing is held until they are signed off at /admin/compliance."
        )
        await _hold_for_review(post_id, reason)
        result = {
            "passed": False,
            "violations": [
                {"type": "rules_pending_review", "rule": industry or "", "detail": reason}
            ],
            "risk_tier": None,
            "industry": industry,
        }
        await record_block(post_id, result, post_text)
        raise ComplianceBlocked(post_id, result)

    gate = await run_compliance_check(post_text, effective)
    if not gate["passed"]:
        details = "; ".join(v["detail"] for v in gate["violations"])
        logger.warning(f"[Publish] Post {post_id} blocked by compliance: {details}")
        await _hold_for_review(post_id, f"Compliance: {details}")
        await record_block(post_id, gate, post_text)
        raise ComplianceBlocked(post_id, gate)

    if gate["appended_disclaimers"]:
        post_text = gate["text"]
        await execute_raw(
            "UPDATE posts SET generated_text = :text, updated_at = NOW() WHERE id = :id",
            {"text": post_text, "id": post_id},
        )
        logger.info(
            f"[Publish] Appended {len(gate['appended_disclaimers'])} required disclaimer(s) "
            f"to post {post_id}"
        )
    return post_text


async def _get_or_create_clone(source: Dict[str, Any], dest: Dict[str, Any]) -> Dict[str, Any]:
    existing = await execute_one_raw(
        """
        SELECT * FROM posts
        WHERE source_post_id = :sid AND destination_id = CAST(:did AS uuid)
        """,
        {"sid": source["id"], "did": str(dest["id"])},
    )
    if existing:
        return existing

    prompt_payload = json.dumps(
        {
            "multi_publish": True,
            "source_post_id": int(source["id"]),
            "destination_id": str(dest["id"]),
        }
    )
    row = await execute_one_raw(
        """
        INSERT INTO posts (
          topic_id, source_url, prompt_text, generated_text, image_prompt, image_url,
          status, source_post_id, destination_id, tenant_id
        )
        VALUES (
          :topic_id, :source_url, :prompt_text, :generated_text, :image_prompt, :image_url,
          'draft', :source_post_id, CAST(:destination_id AS uuid), CAST(:tenant_id AS uuid)
        )
        RETURNING *
        """,
        {
            "topic_id": source.get("topic_id"),
            "source_url": source.get("source_url"),
            "prompt_text": prompt_payload,
            "generated_text": source.get("generated_text") or "",
            "image_prompt": source.get("image_prompt"),
            "image_url": source.get("image_url"),
            "source_post_id": int(source["id"]),
            "destination_id": str(dest["id"]),
            "tenant_id": str(source["tenant_id"]) if source.get("tenant_id") else None,
        },
    )
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create destination clone post")
    return row


async def _publish_to_destination(
    *,
    clone: Dict[str, Any],
    dest: Dict[str, Any],
    post_text: str,
    tenant_id: str,
) -> Dict[str, Any]:
    """Attempt LinkedIn create for one destination clone. Never raises — returns result dict."""
    result_base = {
        "destination_id": str(dest["id"]),
        "destination_kind": dest.get("destination_kind"),
        "author_urn": dest.get("author_urn"),
        "display_name": dest.get("display_name"),
        "post_id": int(clone["id"]),
    }

    if clone.get("status") == "published" and clone.get("linkedin_post_urn"):
        return {
            **result_base,
            "status": "published",
            "linkedin_post_urn": clone["linkedin_post_urn"],
            "error": None,
            "skipped_already_published": True,
        }

    # Claim the clone row so concurrent publish requests cannot both call LinkedIn.
    claimed = await execute_one_raw(
        """
        UPDATE posts
        SET status = 'approved', updated_at = NOW()
        WHERE id = :id
          AND tenant_id = CAST(:tid AS uuid)
          AND status IN ('draft', 'failed', 'pending_review')
          AND (linkedin_post_urn IS NULL OR linkedin_post_urn = '')
        RETURNING id, status, linkedin_post_urn, image_url, linkedin_image_urn, generated_text
        """,
        {"id": clone["id"], "tid": tenant_id},
    )
    if not claimed:
        refreshed = await execute_one_raw(
            "SELECT * FROM posts WHERE id = :id AND tenant_id = CAST(:tid AS uuid)",
            {"id": clone["id"], "tid": tenant_id},
        )
        if refreshed and refreshed.get("status") == "published" and refreshed.get("linkedin_post_urn"):
            return {
                **result_base,
                "status": "published",
                "linkedin_post_urn": refreshed["linkedin_post_urn"],
                "error": None,
                "skipped_already_published": True,
            }
        return {
            **result_base,
            "status": "failed",
            "linkedin_post_urn": None,
            "error": "Publish already in progress or clone unavailable",
        }
    clone = {**clone, **claimed}

    author_urn = dest.get("author_urn")
    if not author_urn:
        await execute_raw(
            "UPDATE posts SET status = 'failed', updated_at = NOW() WHERE id = :id",
            {"id": clone["id"]},
        )
        return {
            **result_base,
            "status": "failed",
            "linkedin_post_urn": None,
            "error": "Destination missing author_urn",
        }

    try:
        image_urn = clone.get("linkedin_image_urn")
        if clone.get("image_url") and not image_urn:
            try:
                image_bytes = await download_image_buffer(clone["image_url"])
                image_urn = await upload_image_to_linkedin(
                    image_bytes, author_urn, tenant_id=tenant_id
                )
                await execute_raw(
                    "UPDATE posts SET linkedin_image_urn = :image_urn, updated_at = NOW() WHERE id = :id",
                    {"image_urn": image_urn, "id": clone["id"]},
                )
            except Exception as img_err:
                logger.warning(
                    "[Publish] Image upload failed for clone %s, text-only: %s",
                    clone["id"],
                    img_err,
                )

        linkedin_post_urn = await create_linkedin_post(
            text=post_text,
            author_urn=author_urn,
            image_urn=image_urn,
            tenant_id=tenant_id,
        )
        final_urn = linkedin_post_urn or f"urn:li:share:dev_mock_{int(time.time() * 1000)}"
        await execute_raw(
            """
            UPDATE posts
            SET status = 'published',
                linkedin_post_urn = :urn,
                published_at = NOW(),
                updated_at = NOW()
            WHERE id = :id
            """,
            {"urn": final_urn, "id": clone["id"]},
        )
        return {
            **result_base,
            "status": "published",
            "linkedin_post_urn": final_urn,
            "error": None,
        }
    except HTTPException as http_err:
        err = str(http_err.detail)
        await execute_raw(
            "UPDATE posts SET status = 'failed', updated_at = NOW() WHERE id = :id",
            {"id": clone["id"]},
        )
        return {
            **result_base,
            "status": "failed",
            "linkedin_post_urn": None,
            "error": err,
        }
    except Exception as exc:
        await execute_raw(
            "UPDATE posts SET status = 'failed', updated_at = NOW() WHERE id = :id",
            {"id": clone["id"]},
        )
        return {
            **result_base,
            "status": "failed",
            "linkedin_post_urn": None,
            "error": str(exc)[:500],
        }


async def _refresh_source_aggregate(source_id: int) -> str:
    clones = await execute_raw(
        """
        SELECT status, published_at FROM posts
        WHERE source_post_id = :sid AND destination_id IS NOT NULL
        """,
        {"sid": source_id},
    )
    if not clones:
        await execute_raw(
            "UPDATE posts SET status = 'failed', updated_at = NOW() WHERE id = :id",
            {"id": source_id},
        )
        return "failed"

    statuses = [c.get("status") for c in clones]
    published_n = sum(1 for s in statuses if s == "published")
    failed_n = sum(1 for s in statuses if s == "failed")

    if published_n == len(clones):
        agg = "published"
    elif published_n > 0 and failed_n > 0:
        agg = "partial"
    elif failed_n == len(clones):
        agg = "failed"
    elif published_n > 0:
        agg = "partial"
    else:
        agg = "failed"

    await execute_raw(
        """
        UPDATE posts
        SET status = CAST(:status AS post_status),
            published_at = CASE
              WHEN :status IN ('published', 'partial') THEN (
                SELECT MIN(published_at) FROM posts
                WHERE source_post_id = :id AND status = 'published'
              )
              ELSE published_at
            END,
            updated_at = NOW()
        WHERE id = :id
        """,
        {"id": source_id, "status": agg},
    )
    return agg


async def _source_fully_published(source_id: int) -> bool:
    row = await execute_one_raw(
        "SELECT status FROM posts WHERE id = :id", {"id": source_id}
    )
    if not row or row.get("status") != "published":
        return False
    clones = await execute_raw(
        """
        SELECT status FROM posts
        WHERE source_post_id = :sid AND destination_id IS NOT NULL
        """,
        {"sid": source_id},
    )
    if not clones:
        # Legacy single-publish source with status published
        return True
    return all(c.get("status") == "published" for c in clones)


async def _publish_single_clone(
    post: Dict[str, Any],
    post_text: str,
    tenant_id: str,
) -> Dict[str, Any]:
    dest = await execute_one_raw(
        """
        SELECT id, author_urn, destination_kind, display_name, is_enabled, can_publish, archived_at
        FROM linkedin_connections
        WHERE id = CAST(:id AS uuid) AND tenant_id = CAST(:tid AS uuid)
        """,
        {"id": str(post["destination_id"]), "tid": tenant_id},
    )
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found for clone")
    if dest.get("archived_at"):
        raise HTTPException(status_code=400, detail="Destination is no longer available")
    if not dest.get("is_enabled") or not dest.get("can_publish"):
        raise HTTPException(
            status_code=400,
            detail=NO_DESTINATIONS_DETAIL,
        )

    result = await _publish_to_destination(
        clone=post, dest=dest, post_text=post_text, tenant_id=tenant_id
    )
    source_id = post.get("source_post_id")
    source_status = None
    if source_id:
        source_status = await _refresh_source_aggregate(int(source_id))
    return {
        "ok": True,
        "source_post_id": int(source_id) if source_id else int(post["id"]),
        "source_status": source_status or result.get("status"),
        "results": [result],
    }


async def publish_post(
    post_id: int,
    tenant_id: str,
) -> Dict[str, Any]:
    tid = tenant_id

    post = await execute_one_raw(
        "SELECT * FROM posts WHERE id = :id AND tenant_id = CAST(:tid AS uuid)",
        {"id": post_id, "tid": tid},
    )
    if not post:
        raise HTTPException(status_code=404, detail=f"Post {post_id} not found")

    # Clone retry path
    if post.get("destination_id"):
        if post["status"] not in ("approved", "draft", "pending_review", "failed", "partial"):
            if post["status"] == "published" and post.get("linkedin_post_urn"):
                raise HTTPException(status_code=409, detail="Post already published")
            raise HTTPException(
                status_code=400,
                detail=f"Cannot publish post with status: {post['status']}",
            )
        post_text = await _run_compliance(post_id, post.get("generated_text") or "")
        account = await get_stored_account(tid)
        if not account:
            raise HTTPException(status_code=401, detail="No LinkedIn account connected")
        return await _publish_single_clone(post, post_text, tid)

    # Source fan-out
    if await _source_fully_published(post_id):
        raise HTTPException(status_code=409, detail="Post already published")

    if post["status"] not in ("approved", "draft", "pending_review", "failed", "partial"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot publish post with status: {post['status']}",
        )

    post_text = await _run_compliance(post_id, post.get("generated_text") or "")

    account = await get_stored_account(tid)
    if not account:
        raise HTTPException(status_code=401, detail="No LinkedIn account connected")

    destinations = await list_enabled_publishable(tid)
    if not destinations:
        raise HTTPException(status_code=400, detail=NO_DESTINATIONS_DETAIL)

    await execute_raw(
        """
        UPDATE posts SET status = 'approved', updated_at = NOW()
        WHERE id = :id AND tenant_id = CAST(:tid AS uuid) AND status NOT IN ('published', 'partial')
        """,
        {"id": post_id, "tid": tid},
    )

    results: List[Dict[str, Any]] = []
    for dest in destinations:
        clone = await _get_or_create_clone(post, dest)
        # Re-read after upsert for fresh status (clone id; clones inherit source tenant_id)
        clone = (
            await execute_one_raw(
                "SELECT * FROM posts WHERE id = :id AND tenant_id = CAST(:tid AS uuid)",
                {"id": clone["id"], "tid": tid},
            )
            or clone
        )
        outcome = await _publish_to_destination(
            clone=clone,
            dest=dest,
            post_text=post_text,
            tenant_id=tid,
        )
        # Strip internal skip flag from public envelope
        outcome.pop("skipped_already_published", None)
        results.append(outcome)

    source_status = await _refresh_source_aggregate(post_id)
    return {
        "ok": True,
        "source_post_id": post_id,
        "source_status": source_status,
        "results": results,
    }
