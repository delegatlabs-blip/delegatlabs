import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.api.auth_context import AuthContext, get_auth_context
from app.api.deps import require_auth
from app.api.endpoints.onboarding import slugify
from app.core.database import (
    AsyncSessionLocal,
    execute_one_raw,
    execute_raw,
    execute_raw_on_session,
)
from app.schemas.topic import TopicResponse, TopicUpdateRequest
from app.services.adaptive_onboarding.persistence import get_or_migrate
from app.services.gemini_persona_topics import generate_persona_topic_catalog

router = APIRouter(prefix="/topics", tags=["topics"], dependencies=[Depends(require_auth)])

_TOPIC_SELECT = """
    SELECT t.id, t.name, t.slug, t.weight, t.is_active, t.created_at, t.updated_at,
           t.options, t.selected_option, t.tenant_id,
           COUNT(p.id) FILTER (WHERE p.status = 'published') as published_count,
           AVG(pp.score) as avg_score
    FROM topics t
    LEFT JOIN posts p ON p.topic_id = t.id
    LEFT JOIN post_performance pp ON pp.post_id = p.id
"""


def _parse_options(raw: Any) -> List[Dict[str, Any]]:
    if raw is None:
        return []
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            return []
    if not isinstance(raw, list):
        return []
    out: List[Dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        out.append(
            {
                "value": item.get("value"),
                "label": item.get("label"),
                "description": item.get("description"),
            }
        )
    return out


def topic_to_response(row: Dict[str, Any]) -> Dict[str, Any]:
    pub = row.get("published_count")
    avg = row.get("avg_score")
    return {
        "id": int(row["id"]),
        "name": row["name"],
        "slug": row["slug"],
        "weight": float(row["weight"]),
        "is_active": bool(row["is_active"]),
        "published_count": int(pub or 0),
        "avg_score": float(avg) if avg is not None else None,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "persona_generated": row.get("tenant_id") is not None,
        "selected_option_value": row.get("selected_option"),
        "options": _parse_options(row.get("options")),
    }


async def tenant_has_replacement(tenant_id: str) -> bool:
    row = await execute_one_raw(
        "SELECT tenant_id FROM tenant_topic_replacements WHERE tenant_id = :tid",
        {"tid": tenant_id},
    )
    return row is not None


async def list_catalog_topics(tenant_id: str) -> List[Dict[str, Any]]:
    if await tenant_has_replacement(tenant_id):
        where = "t.tenant_id = :tid"
        params: Dict[str, Any] = {"tid": tenant_id}
    else:
        where = "t.tenant_id IS NULL"
        params = {}
    sql = f"""
    {_TOPIC_SELECT}
    WHERE {where}
    GROUP BY t.id
    ORDER BY t.id
    """
    rows = await execute_raw(sql, params)
    return [topic_to_response(r) for r in rows]


def _is_valid_persona_catalog(catalog: Any) -> bool:
    if not isinstance(catalog, list) or len(catalog) != 10:
        return False
    names: List[str] = []
    for item in catalog:
        if not isinstance(item, dict):
            return False
        name = str(item.get("name") or "").strip()
        if not name:
            return False
        names.append(name)
        opts = item.get("options")
        if not isinstance(opts, list) or len(opts) != 5:
            return False
        values: List[str] = []
        for opt in opts:
            if not isinstance(opt, dict):
                return False
            value = str(opt.get("value") or "").strip()
            label = str(opt.get("label") or "").strip()
            if not value or not label:
                return False
            values.append(value)
        if len(set(values)) != 5:
            return False
    return len(set(names)) == 10


def _unique_slugs(names: List[str]) -> List[str]:
    used = set()
    slugs: List[str] = []
    for name in names:
        base = slugify(name) or "persona-topic"
        slug = base
        n = 2
        while slug in used:
            slug = f"{base}-{n}"
            n += 1
        used.add(slug)
        slugs.append(slug)
    return slugs


async def persist_persona_catalog(tenant_id: str, catalog: List[Dict[str, Any]]) -> None:
    slugs = _unique_slugs([item["name"] for item in catalog])
    async with AsyncSessionLocal() as session:
        try:
            await execute_raw_on_session(
                session,
                "SELECT pg_advisory_xact_lock(hashtext(:tid))",
                {"tid": tenant_id},
            )
            existing = await execute_raw_on_session(
                session,
                "SELECT id FROM topics WHERE tenant_id = :tid",
                {"tid": tenant_id},
            )
            if len(existing) == 10:
                await execute_raw_on_session(
                    session,
                    """
                    INSERT INTO tenant_topic_replacements (tenant_id, seed_replaced_at)
                    VALUES (:tid, NOW())
                    ON CONFLICT (tenant_id) DO NOTHING
                    """,
                    {"tid": tenant_id},
                )
                await session.commit()
                return
            await execute_raw_on_session(
                session,
                "DELETE FROM topics WHERE tenant_id = :tid",
                {"tid": tenant_id},
            )
            for item, slug in zip(catalog, slugs):
                await execute_raw_on_session(
                    session,
                    """
                    INSERT INTO topics (
                        name, slug, weight, is_active, selected_option, tenant_id, options, updated_at
                    )
                    VALUES (
                        :name, :slug, 0.6, false, NULL, :tid, CAST(:options AS jsonb), NOW()
                    )
                    """,
                    {
                        "name": item["name"],
                        "slug": slug,
                        "tid": tenant_id,
                        "options": json.dumps(item["options"]),
                    },
                )
            await execute_raw_on_session(
                session,
                """
                INSERT INTO tenant_topic_replacements (tenant_id, seed_replaced_at)
                VALUES (:tid, NOW())
                ON CONFLICT (tenant_id) DO UPDATE SET seed_replaced_at = EXCLUDED.seed_replaced_at
                """,
                {"tid": tenant_id},
            )
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@router.get("")
async def get_topics(ctx: AuthContext = Depends(get_auth_context)):
    return await list_catalog_topics(ctx.tenant_id)


@router.post("/generate-persona")
async def generate_persona_topics(ctx: AuthContext = Depends(get_auth_context)):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    profile, session = await get_or_migrate(ctx.tenant_id)
    if session.status != "completed":
        raise HTTPException(status_code=400, detail="Adaptive session is not completed")

    existing = await execute_raw(
        f"""
        {_TOPIC_SELECT}
        WHERE t.tenant_id = :tid
        GROUP BY t.id
        ORDER BY t.id
        """,
        {"tid": ctx.tenant_id},
    )
    if len(existing) == 10:
        return {"ok": True, "topics": [topic_to_response(r) for r in existing]}

    try:
        catalog = await generate_persona_topic_catalog(profile=profile)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    if not _is_valid_persona_catalog(catalog):
        raise HTTPException(
            status_code=500,
            detail="Gemini API post generation failed across all models. Error: expected 10 topics with 5 options each",
        )

    await persist_persona_catalog(ctx.tenant_id, catalog)
    topics = await list_catalog_topics(ctx.tenant_id)
    return {"ok": True, "topics": topics}


async def update_topic_for_tenant(tenant_id: str, id: int, body: TopicUpdateRequest) -> Dict[str, Any]:
    """Core update logic shared by the tenant-scoped and admin-scoped routes."""
    fields: List[str] = []
    params: Dict[str, Any] = {"id": id}

    if body.weight is not None:
        if body.weight < 0 or body.weight > 1:
            raise HTTPException(status_code=400, detail="Weight must be 0–1")
        fields.append("weight = :weight")
        params["weight"] = body.weight
    if body.is_active is not None:
        fields.append("is_active = :is_active")
        params["is_active"] = body.is_active
    if body.name is not None:
        fields.append("name = :name")
        params["name"] = body.name
    if "selected_option_value" in body.model_fields_set:
        fields.append("selected_option = :selected_option")
        params["selected_option"] = body.selected_option_value

    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    replaced = await tenant_has_replacement(tenant_id)
    if not replaced:
        raise HTTPException(status_code=404, detail="Topic not found")
    catalog_pred = "t.tenant_id = :tid"
    update_pred = "id = :id AND tenant_id = :tid"
    params["tid"] = tenant_id
    lookup_params: Dict[str, Any] = {"id": id, "tid": tenant_id}

    stored = await execute_one_raw(
        f"""
        {_TOPIC_SELECT}
        WHERE {catalog_pred} AND t.id = :id
        GROUP BY t.id
        """,
        lookup_params,
    )
    if not stored:
        raise HTTPException(status_code=404, detail="Topic not found")

    options = _parse_options(stored.get("options"))
    resulting_active = body.is_active if body.is_active is not None else bool(stored["is_active"])
    if "selected_option_value" in body.model_fields_set:
        resulting_selected = body.selected_option_value
    else:
        resulting_selected = stored.get("selected_option")
    if (
        resulting_active is True
        and options
        and (resulting_selected is None or resulting_selected == "")
    ):
        raise HTTPException(
            status_code=400,
            detail="selected_option_value is required when is_active is true",
        )
    if "selected_option_value" in body.model_fields_set:
        values = [o.get("value") for o in options]
        if body.selected_option_value not in values:
            raise HTTPException(
                status_code=400,
                detail="selected_option_value must match an option value",
            )

    fields.append("updated_at = NOW()")
    sql = f"UPDATE topics SET {', '.join(fields)} WHERE {update_pred} RETURNING id"
    rows = await execute_raw(sql, params)
    if not rows:
        raise HTTPException(status_code=404, detail="Topic not found")

    updated = await execute_one_raw(
        f"""
        {_TOPIC_SELECT}
        WHERE {catalog_pred} AND t.id = :id
        GROUP BY t.id
        """,
        lookup_params,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic_to_response(updated)


@router.patch("/{id}")
async def update_topic(
    id: int,
    body: TopicUpdateRequest,
    ctx: AuthContext = Depends(get_auth_context),
):
    ctx.require_tenant_roles({"owner", "admin", "editor"})
    result = await update_topic_for_tenant(ctx.tenant_id, id, body)
    return TopicResponse.model_validate(result)
