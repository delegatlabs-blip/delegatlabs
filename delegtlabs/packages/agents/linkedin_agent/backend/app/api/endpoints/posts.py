import json
import os
import time
import uuid
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from app.api.auth_context import AuthContext, get_auth_context
from app.api.deps import require_auth
from app.core.config import settings
from app.core.database import execute_raw, execute_one_raw
from app.schemas.post import (
    GeneratePostRequest,
    ImprovePostRequest,
    ImprovePostResponse,
    PostUpdateRequest,
    RejectPostRequest,
)
from app.services.generation import run_generation_pipeline
from app.services.publish import publish_post
from app.services.compliance_gate import ComplianceBlocked
from app.services.gemini import derive_image_prompt
from app.services.gemini_improve import improve_post_text
from app.services.grok import generate_and_store_image
from app.services.billing import action_cost, consume_for_action, credit_balance

router = APIRouter(prefix="/posts", tags=["posts"], dependencies=[Depends(require_auth)])

LINKEDIN_CHAR_LIMIT = 3000


def _normalize_tags(tags: Optional[str]) -> List[str]:
    if not tags:
        return []
    return [t.strip().lstrip("#") for t in tags.split(",") if t.strip()]


def _compose_manual_body(title: str, description: str, tag_list: List[str]) -> str:
    body = f"{title.strip()}\n\n{description.strip()}"
    if tag_list:
        hashtags = " ".join(f"#{t}" for t in tag_list)
        body = f"{body}\n\n{hashtags}"
    return body


_ALLOWED_MANUAL_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
}


def _normalize_upload_content_type(content_type: Optional[str]) -> str:
    if content_type is None:
        return ""
    return content_type.strip().lower().split(";", 1)[0]


async def _save_uploaded_image(image: UploadFile) -> str:
    normalized = _normalize_upload_content_type(image.content_type)
    ext = _ALLOWED_MANUAL_IMAGE_TYPES.get(normalized)
    if ext is None:
        raise HTTPException(status_code=400, detail="Image must be JPEG or PNG")
    content = await image.read()
    name = f"{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}.{ext}"
    uploads_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    with open(os.path.join(uploads_dir, name), "wb") as f:
        f.write(content)
    server_url = settings.BACKEND_URL or f"http://localhost:{settings.PORT}"
    return f"{server_url}/uploads/{name}"


def _compliance_http(blocked: ComplianceBlocked) -> HTTPException:
    return HTTPException(
        status_code=422,
        detail={
            "error": "compliance_blocked",
            "message": str(blocked),
            "violations": blocked.result.get("violations", []),
        },
    )


async def _fetch_post(post_id: int, tenant_id: str) -> Optional[Dict[str, Any]]:
    return await execute_one_raw(
        """
        SELECT p.*, t.name as topic_name, t.slug as topic_slug
        FROM posts p
        LEFT JOIN topics t ON p.topic_id = t.id
        WHERE p.id = :id AND p.tenant_id = CAST(:tenant_id AS uuid)
        """,
        {"id": post_id, "tenant_id": tenant_id},
    )


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_post_endpoint(
    body: GeneratePostRequest, ctx: AuthContext = Depends(get_auth_context)
):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    action_key = "text_post" if body.skipImage else "image_post"
    amount = await action_cost(action_key)
    if amount > 0:
        balance = await credit_balance(ctx.tenant_id)
        if balance < amount:
            raise HTTPException(
                402,
                detail=f"Insufficient credits — {action_key} costs {amount}, "
                       f"balance is {balance}",
            )

    post = await run_generation_pipeline(
        topic_id=body.topicId,
        source_url=body.sourceUrl,
        tenant_id=ctx.tenant_id,
        skip_image=body.skipImage,
    )
    await consume_for_action(ctx.tenant_id, action_key)
    return post


@router.post("/manual", status_code=status.HTTP_201_CREATED)
async def manual_post_endpoint(
    title: str = Form(...),
    description: str = Form(...),
    tags: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    ctx: AuthContext = Depends(get_auth_context),
):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    title_clean = (title or "").strip()
    description_clean = (description or "").strip()
    if not title_clean or not description_clean:
        raise HTTPException(status_code=400, detail="title and description are required")

    tag_list = _normalize_tags(tags)
    generated_text = _compose_manual_body(title_clean, description_clean, tag_list)
    if len(generated_text) > LINKEDIN_CHAR_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Composed post exceeds LinkedIn limit ({len(generated_text)} / {LINKEDIN_CHAR_LIMIT})",
        )

    unit = await action_cost("manual_post")
    amount = unit * 1
    if amount > 0:
        balance = await credit_balance(ctx.tenant_id)
        if balance < amount:
            raise HTTPException(
                402,
                detail=f"Insufficient credits — manual_post costs {amount}, "
                       f"balance is {balance}",
            )

    image_url: Optional[str] = None
    if image is not None and image.filename:
        image_url = await _save_uploaded_image(image)

    prompt_payload = json.dumps({"manual": True, "title": title_clean, "tags": tag_list})
    insert_sql = """
    INSERT INTO posts (topic_id, source_url, prompt_text, generated_text, image_prompt, image_url, status, tenant_id)
    VALUES (NULL, NULL, :prompt_text, :generated_text, NULL, :image_url, 'draft', CAST(:tenant_id AS uuid))
    RETURNING *
    """
    row = await execute_one_raw(
        insert_sql,
        {
            "prompt_text": prompt_payload,
            "generated_text": generated_text,
            "image_url": image_url,
            "tenant_id": ctx.tenant_id,
        },
    )
    if not row:
        raise HTTPException(status_code=500, detail="Failed to save manual post")

    post_id = int(row["id"])
    try:
        pub = await publish_post(post_id, tenant_id=ctx.tenant_id)
    except ComplianceBlocked as blocked:
        raise _compliance_http(blocked)

    results = pub.get("results") or []
    source_status = pub.get("source_status")
    top_urn = pub.get("linkedin_post_urn")
    linkedin_ok = (
        source_status in ("published", "partial")
        or any(isinstance(r, dict) and r.get("status") == "published" for r in results)
        or (isinstance(top_urn, str) and top_urn != "")
    )
    if linkedin_ok:
        await consume_for_action(ctx.tenant_id, "manual_post")

    post = await _fetch_post(post_id, ctx.tenant_id)
    return {"ok": True, "post": post or row, **pub}

@router.post("/improve", response_model=ImprovePostResponse)
async def improve_post_endpoint(
    body: ImprovePostRequest,
    ctx: AuthContext = Depends(get_auth_context),
):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    title_clean = (body.title or "").strip()
    description_clean = (body.description or "").strip()
    tag_list = _normalize_tags(body.tags)

    if title_clean == "" and description_clean == "":
        raise HTTPException(status_code=400, detail="title or description is required")

    composed_in = _compose_manual_body(title_clean, description_clean, tag_list)
    if len(composed_in) > LINKEDIN_CHAR_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Composed post exceeds LinkedIn limit ({len(composed_in)} / {LINKEDIN_CHAR_LIMIT})",
        )

    try:
        result = await improve_post_text(
            title=title_clean, description=description_clean, tags=tag_list
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    html = result["html"]
    plainText = result["plainText"]
    composed_out = _compose_manual_body(title_clean, plainText, tag_list)
    if len(composed_out) > LINKEDIN_CHAR_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Composed post exceeds LinkedIn limit ({len(composed_out)} / {LINKEDIN_CHAR_LIMIT})",
        )

    return {"ok": True, "html": html, "plainText": plainText}

@router.get("")
async def get_posts(
    status: Optional[str] = None,
    topicId: Optional[str] = None,
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    limit: int = 50,
    offset: int = 0,
    ctx: AuthContext = Depends(get_auth_context),
):
    conditions: List[str] = ["p.tenant_id = CAST(:tenant_id AS uuid)"]
    params: Dict[str, Any] = {"tenant_id": ctx.tenant_id}

    if status:
        conditions.append("p.status = :status::post_status")
        params["status"] = status
    if topicId:
        conditions.append("p.topic_id = :topic_id")
        params["topic_id"] = int(topicId)
    if from_date:
        conditions.append("p.created_at >= :from_date::timestamptz")
        params["from_date"] = from_date
    if to_date:
        conditions.append("p.created_at <= :to_date::timestamptz")
        params["to_date"] = to_date

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    sql = f"""
    SELECT p.*, t.name as topic_name, t.slug as topic_slug,
           (SELECT score FROM post_performance WHERE post_id = p.id ORDER BY recorded_at DESC LIMIT 1) as latest_score
    FROM posts p
    LEFT JOIN topics t ON p.topic_id = t.id
    {where_clause}
    ORDER BY p.created_at DESC
    LIMIT :limit OFFSET :offset
    """
    params["limit"] = limit
    params["offset"] = offset

    posts = await execute_raw(sql, params)

    count_sql = f"SELECT COUNT(*) as count FROM posts p {where_clause}"
    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    count_row = await execute_one_raw(count_sql, count_params)
    total = int(count_row["count"]) if count_row else 0

    return {
        "posts": posts,
        "total": total,
        "limit": limit,
        "offset": offset,
    }

@router.get("/{id}")
async def get_post_by_id(id: int, ctx: AuthContext = Depends(get_auth_context)):
    sql = """
    SELECT p.*, t.name as topic_name, t.slug as topic_slug
    FROM posts p
    LEFT JOIN topics t ON p.topic_id = t.id
    WHERE p.id = :id AND p.tenant_id = CAST(:tenant_id AS uuid)
    """
    post = await execute_one_raw(sql, {"id": id, "tenant_id": ctx.tenant_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.patch("/{id}")
async def update_post(id: int, body: PostUpdateRequest, ctx: AuthContext = Depends(get_auth_context)):
    fields: List[str] = []
    params: Dict[str, Any] = {"id": id, "tenant_id": ctx.tenant_id}

    if body.generated_text is not None:
        fields.append("generated_text = :generated_text")
        params["generated_text"] = body.generated_text
    if body.image_url is not None:
        fields.append("image_url = :image_url")
        params["image_url"] = body.image_url
        fields.append("linkedin_image_urn = NULL")
    if body.source_url is not None:
        fields.append("source_url = :source_url")
        params["source_url"] = body.source_url
    if body.scheduled_at is not None:
        fields.append("scheduled_at = :scheduled_at::timestamptz")
        params["scheduled_at"] = body.scheduled_at

    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    fields.append("updated_at = NOW()")
    sql = f"UPDATE posts SET {', '.join(fields)} WHERE id = :id AND tenant_id = CAST(:tenant_id AS uuid) RETURNING *"

    rows = await execute_raw(sql, params)
    if not rows:
        raise HTTPException(status_code=404, detail="Post not found")
    return rows[0]

@router.post("/{id}/approve")
async def approve_post(id: int, ctx: AuthContext = Depends(get_auth_context)):
    sql = """
    UPDATE posts
    SET status = 'approved', updated_at = NOW()
    WHERE id = :id AND tenant_id = CAST(:tenant_id AS uuid) AND status IN ('draft', 'pending_review')
    RETURNING *
    """
    rows = await execute_raw(sql, {"id": id, "tenant_id": ctx.tenant_id})
    if not rows:
        raise HTTPException(status_code=404, detail="Post not found or cannot be approved")
    return rows[0]

@router.post("/{id}/reject")
async def reject_post(id: int, body: Optional[RejectPostRequest] = None, ctx: AuthContext = Depends(get_auth_context)):
    reason = body.reason if body else None
    sql = """
    UPDATE posts
    SET status = 'rejected', rejection_reason = :reason, updated_at = NOW()
    WHERE id = :id AND tenant_id = CAST(:tenant_id AS uuid) AND status NOT IN ('published', 'rejected')
    RETURNING *
    """
    rows = await execute_raw(sql, {"id": id, "reason": reason, "tenant_id": ctx.tenant_id})
    if not rows:
        raise HTTPException(status_code=404, detail="Post not found or cannot be rejected")
    return rows[0]

@router.post("/{id}/publish")
async def publish_post_endpoint(id: int, ctx: AuthContext = Depends(get_auth_context)):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    try:
        result = await publish_post(id, tenant_id=ctx.tenant_id)
    except ComplianceBlocked as blocked:
        raise _compliance_http(blocked)
    return {"ok": True, **result}


@router.post("/{id}/repost", status_code=status.HTTP_201_CREATED)
async def repost_post_endpoint(id: int, ctx: AuthContext = Depends(get_auth_context)):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    source = await execute_one_raw(
        "SELECT * FROM posts WHERE id = :id AND tenant_id = CAST(:tenant_id AS uuid)",
        {"id": id, "tenant_id": ctx.tenant_id},
    )
    if not source:
        raise HTTPException(status_code=404, detail="Post not found")

    prompt_payload = json.dumps({"repost_of": id, "manual": False})
    insert_sql = """
    INSERT INTO posts (topic_id, source_url, prompt_text, generated_text, image_prompt, image_url, status, tenant_id)
    VALUES (:topic_id, :source_url, :prompt_text, :generated_text, :image_prompt, :image_url, 'draft', CAST(:tenant_id AS uuid))
    RETURNING *
    """
    row = await execute_one_raw(
        insert_sql,
        {
            "topic_id": source.get("topic_id"),
            "source_url": source.get("source_url"),
            "prompt_text": prompt_payload,
            "generated_text": source.get("generated_text") or "",
            "image_prompt": source.get("image_prompt"),
            "image_url": source.get("image_url"),
            "tenant_id": ctx.tenant_id,
        },
    )
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create repost")

    new_id = int(row["id"])
    try:
        pub = await publish_post(new_id, tenant_id=ctx.tenant_id)
    except ComplianceBlocked as blocked:
        raise _compliance_http(blocked)

    post = await _fetch_post(new_id, ctx.tenant_id)
    return {"ok": True, "post": post or row, **pub}


@router.post("/{id}/regenerate-image")
async def regenerate_image(id: int, ctx: AuthContext = Depends(get_auth_context)):
    sql = """
    SELECT generated_text, image_prompt FROM posts
    WHERE id = :id AND tenant_id = CAST(:tenant_id AS uuid)
    """
    post = await execute_one_raw(sql, {"id": id, "tenant_id": ctx.tenant_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    image_prompt = post.get("image_prompt") or await derive_image_prompt(post["generated_text"])
    grok_res = await generate_and_store_image(image_prompt)
    supabase_url = grok_res["supabaseUrl"]

    update_sql = """
    UPDATE posts SET image_url = :image_url, linkedin_image_urn = NULL, updated_at = NOW()
    WHERE id = :id AND tenant_id = CAST(:tenant_id AS uuid) RETURNING *
    """
    rows = await execute_raw(update_sql, {"image_url": supabase_url, "id": id, "tenant_id": ctx.tenant_id})
    if not rows:
        raise HTTPException(status_code=404, detail="Post not found")
    return rows[0]


@router.delete("/{id}")
async def delete_post(id: int, ctx: AuthContext = Depends(get_auth_context)):
    sql = """
    DELETE FROM posts
    WHERE id = :id AND tenant_id = CAST(:tenant_id AS uuid) AND status NOT IN ('published')
    RETURNING id
    """
    rows = await execute_raw(sql, {"id": id, "tenant_id": ctx.tenant_id})
    if not rows:
        raise HTTPException(status_code=404, detail="Post not found or is published (cannot delete)")
    return {"ok": True, "deleted_id": str(id)}
