"""
AC: multi-destination publish — zero dest 400, partial failure, idempotency,
author URN per destination (C-linkedin-multi-publish §§2–7).
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException


def _source_post(post_id: int = 10) -> dict:
    return {
        "id": post_id,
        "topic_id": None,
        "source_url": None,
        "prompt_text": None,
        "generated_text": "Hello LinkedIn",
        "image_prompt": None,
        "image_url": None,
        "status": "approved",
        "destination_id": None,
        "source_post_id": None,
        "linkedin_post_urn": None,
    }


@pytest.mark.asyncio
async def test_publish_zero_destinations_raises_400(tenant_a):
    """Q-4 C / contract §2: reject before LinkedIn or clone insert."""
    from app.services.publish import NO_DESTINATIONS_DETAIL, publish_post

    with (
        patch(
            "app.services.publish.execute_one_raw",
            new_callable=AsyncMock,
            return_value=_source_post(),
        ),
        patch(
            "app.services.publish._source_fully_published",
            new_callable=AsyncMock,
            return_value=False,
        ),
        patch(
            "app.services.publish._run_compliance",
            new_callable=AsyncMock,
            return_value="Hello LinkedIn",
        ),
        patch(
            "app.services.publish.get_stored_account",
            new_callable=AsyncMock,
            return_value={"id": 1, "member_urn": "urn:li:person:x"},
        ),
        patch(
            "app.services.publish.list_enabled_publishable",
            new_callable=AsyncMock,
            return_value=[],
        ),
        patch(
            "app.services.publish.create_linkedin_post",
            new_callable=AsyncMock,
        ) as mock_create,
    ):
        with pytest.raises(HTTPException) as exc_info:
            await publish_post(10, tenant_id=tenant_a)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == NO_DESTINATIONS_DETAIL
    mock_create.assert_not_called()


@pytest.mark.asyncio
async def test_publish_partial_failure_continues(
    tenant_a, dest_personal, dest_org
):
    """Partial success: one SUCCESS + one FAIL; no rollback of success (contract §3)."""
    from app.services.publish import publish_post

    source = _source_post(20)
    clone_personal = {
        **source,
        "id": 201,
        "source_post_id": 20,
        "destination_id": dest_personal["id"],
        "status": "draft",
        "linkedin_post_urn": None,
    }
    clone_org = {
        **source,
        "id": 202,
        "source_post_id": 20,
        "destination_id": dest_org["id"],
        "status": "draft",
        "linkedin_post_urn": None,
    }
    clones = [clone_personal, clone_org]

    async def create_side_effect(*, text, author_urn, image_urn=None, tenant_id=None):
        if author_urn == dest_personal["author_urn"]:
            return "urn:li:share:ok-personal"
        raise HTTPException(status_code=502, detail="LinkedIn API error 403: forbidden")

    get_or_create = AsyncMock(side_effect=clones)
    call_n = {"n": 0}

    async def execute_one_raw(sql: str, params=None):
        if call_n["n"] == 0:
            call_n["n"] += 1
            return source
        pid = (params or {}).get("id")
        for c in clones:
            if c["id"] == pid:
                return c
        return source

    async def execute_raw(sql: str, params=None):
        s = " ".join((sql or "").split()).lower()
        if "source_post_id = :sid" in s:
            return [
                {"status": "published", "published_at": None},
                {"status": "failed", "published_at": None},
            ]
        return []

    with (
        patch(
            "app.services.publish.execute_one_raw",
            side_effect=execute_one_raw,
        ),
        patch(
            "app.services.publish.execute_raw",
            side_effect=execute_raw,
        ),
        patch(
            "app.services.publish._source_fully_published",
            new_callable=AsyncMock,
            return_value=False,
        ),
        patch(
            "app.services.publish._run_compliance",
            new_callable=AsyncMock,
            return_value="Hello LinkedIn",
        ),
        patch(
            "app.services.publish.get_stored_account",
            new_callable=AsyncMock,
            return_value={"id": 1},
        ),
        patch(
            "app.services.publish.list_enabled_publishable",
            new_callable=AsyncMock,
            return_value=[dest_personal, dest_org],
        ),
        patch(
            "app.services.publish._get_or_create_clone",
            side_effect=get_or_create,
        ),
        patch(
            "app.services.publish.create_linkedin_post",
            new_callable=AsyncMock,
            side_effect=create_side_effect,
        ),
        patch(
            "app.services.publish.download_image_buffer",
            new_callable=AsyncMock,
        ),
    ):
        result = await publish_post(20, tenant_id=tenant_a)

    assert result["ok"] is True
    assert result["source_status"] == "partial"
    assert len(result["results"]) == 2
    statuses = {r["author_urn"]: r["status"] for r in result["results"]}
    assert statuses[dest_personal["author_urn"]] == "published"
    assert statuses[dest_org["author_urn"]] == "failed"
    assert result["results"][0]["linkedin_post_urn"] == "urn:li:share:ok-personal"
    assert result["results"][1]["error"]


@pytest.mark.asyncio
async def test_idempotent_republish_skips_already_published(
    tenant_a, dest_personal
):
    """Re-publish: clone already published+URN → skip LinkedIn (contract §5)."""
    from app.services.publish import publish_post

    source = _source_post(30)
    source["status"] = "partial"
    published_clone = {
        "id": 301,
        "source_post_id": 30,
        "destination_id": dest_personal["id"],
        "status": "published",
        "linkedin_post_urn": "urn:li:share:already",
        "generated_text": "Hello",
        "image_url": None,
        "linkedin_image_urn": None,
    }

    call_n = {"n": 0}

    async def execute_one_raw(sql: str, params=None):
        if call_n["n"] == 0:
            call_n["n"] += 1
            return source
        return published_clone

    async def execute_raw(sql: str, params=None):
        s = " ".join((sql or "").split()).lower()
        if "source_post_id = :sid" in s:
            return [{"status": "published", "published_at": None}]
        return []

    with (
        patch(
            "app.services.publish.execute_one_raw",
            side_effect=execute_one_raw,
        ),
        patch(
            "app.services.publish.execute_raw",
            side_effect=execute_raw,
        ),
        patch(
            "app.services.publish._source_fully_published",
            new_callable=AsyncMock,
            return_value=False,
        ),
        patch(
            "app.services.publish._run_compliance",
            new_callable=AsyncMock,
            return_value="Hello",
        ),
        patch(
            "app.services.publish.get_stored_account",
            new_callable=AsyncMock,
            return_value={"id": 1},
        ),
        patch(
            "app.services.publish.list_enabled_publishable",
            new_callable=AsyncMock,
            return_value=[dest_personal],
        ),
        patch(
            "app.services.publish._get_or_create_clone",
            new_callable=AsyncMock,
            return_value=published_clone,
        ),
        patch(
            "app.services.publish.create_linkedin_post",
            new_callable=AsyncMock,
        ) as mock_create,
    ):
        result = await publish_post(30, tenant_id=tenant_a)

    mock_create.assert_not_called()
    assert result["ok"] is True
    assert result["results"][0]["status"] == "published"
    assert result["results"][0]["linkedin_post_urn"] == "urn:li:share:already"


@pytest.mark.asyncio
async def test_create_linkedin_post_called_with_author_urn_per_destination(
    tenant_a, dest_personal, dest_org
):
    """Each destination → Posts API author = that destination's author_urn."""
    from app.services.publish import publish_post

    source = _source_post(40)
    clone_p = {
        "id": 401,
        "source_post_id": 40,
        "destination_id": dest_personal["id"],
        "status": "draft",
        "linkedin_post_urn": None,
        "image_url": None,
        "linkedin_image_urn": None,
    }
    clone_o = {
        "id": 402,
        "source_post_id": 40,
        "destination_id": dest_org["id"],
        "status": "draft",
        "linkedin_post_urn": None,
        "image_url": None,
        "linkedin_image_urn": None,
    }
    clones = [clone_p, clone_o]
    call_n = {"n": 0}

    async def execute_one_raw(sql: str, params=None):
        if call_n["n"] == 0:
            call_n["n"] += 1
            return source
        pid = (params or {}).get("id")
        for c in clones:
            if c["id"] == pid:
                return c
        return source

    async def execute_raw(sql: str, params=None):
        s = " ".join((sql or "").split()).lower()
        if "source_post_id = :sid" in s:
            return [
                {"status": "published", "published_at": None},
                {"status": "published", "published_at": None},
            ]
        return []

    mock_create = AsyncMock(
        side_effect=lambda **kw: f"urn:li:share:{kw['author_urn'].split(':')[-1]}"
    )

    with (
        patch(
            "app.services.publish.execute_one_raw",
            side_effect=execute_one_raw,
        ),
        patch(
            "app.services.publish.execute_raw",
            side_effect=execute_raw,
        ),
        patch(
            "app.services.publish._source_fully_published",
            new_callable=AsyncMock,
            return_value=False,
        ),
        patch(
            "app.services.publish._run_compliance",
            new_callable=AsyncMock,
            return_value="Hello LinkedIn",
        ),
        patch(
            "app.services.publish.get_stored_account",
            new_callable=AsyncMock,
            return_value={"id": 1},
        ),
        patch(
            "app.services.publish.list_enabled_publishable",
            new_callable=AsyncMock,
            return_value=[dest_personal, dest_org],
        ),
        patch(
            "app.services.publish._get_or_create_clone",
            new_callable=AsyncMock,
            side_effect=clones,
        ),
        patch(
            "app.services.publish.create_linkedin_post",
            mock_create,
        ),
    ):
        result = await publish_post(40, tenant_id=tenant_a)

    assert mock_create.await_count == 2
    authors = [c.kwargs["author_urn"] for c in mock_create.await_args_list]
    assert authors == [dest_personal["author_urn"], dest_org["author_urn"]]
    assert result["source_status"] == "published"


@pytest.mark.asyncio
async def test_create_linkedin_post_http_body_author_urn(person_urn):
    """Unit: create_linkedin_post posts JSON with author = provided URN (no real LinkedIn)."""
    from app.services.linkedin import create_linkedin_post

    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.headers = {"x-restli-id": "urn:li:share:1"}
    mock_response.text = ""

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with (
        patch(
            "app.services.linkedin.get_decrypted_token",
            new_callable=AsyncMock,
            return_value="tok",
        ),
        patch(
            "app.services.linkedin.httpx.AsyncClient",
            return_value=mock_client,
        ),
    ):
        urn = await create_linkedin_post(
            text="hi",
            author_urn=person_urn,
            tenant_id="11111111-1111-1111-1111-111111111111",
        )

    assert urn == "urn:li:share:1"
    body = mock_client.post.await_args.kwargs["json"]
    assert body["author"] == person_urn
    assert body["visibility"] == "PUBLIC"
