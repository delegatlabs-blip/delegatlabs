import secrets
import urllib.parse
import logging
import httpx
from typing import Optional, Dict, Any, Tuple
from fastapi import HTTPException
from app.core.config import settings
from app.core.security import encrypt, decrypt
from app.core.database import execute_one_raw
from app.services.audit import DEFAULT_TENANT_ID

logger = logging.getLogger(__name__)

LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo"
LINKEDIN_API_BASE = "https://api.linkedin.com"

OAUTH_SCOPES_DEFAULT = "openid profile email w_member_social"


def oauth_scopes() -> str:
    """Scopes from settings — never hardcode org scopes the Developer App may lack."""
    raw = (settings.LINKEDIN_OAUTH_SCOPES or OAUTH_SCOPES_DEFAULT).strip()
    return raw or OAUTH_SCOPES_DEFAULT


# Back-compat alias for imports/tests that still reference the name.
OAUTH_SCOPES = OAUTH_SCOPES_DEFAULT


async def _store_oauth_state(
    state: str, tenant_id: Optional[str], intent: str = "connect"
) -> None:
    """Persist OAuth CSRF state with a 10-minute TTL.

    intent='connect' binds the flow to an existing tenant. intent='login' has no tenant
    yet -- one is provisioned only after LinkedIn tells us who the person is.
    """
    sql = """
    INSERT INTO oauth_states (state, expires_at, tenant_id, intent)
    VALUES (:state, NOW() + INTERVAL '600 seconds', CAST(:tenant_id AS uuid), :intent)
    ON CONFLICT (state) DO UPDATE SET
      expires_at = EXCLUDED.expires_at,
      tenant_id = EXCLUDED.tenant_id,
      intent = EXCLUDED.intent
    """
    await execute_one_raw(sql, {"state": state, "tenant_id": tenant_id, "intent": intent})
    await execute_one_raw("DELETE FROM oauth_states WHERE expires_at < NOW()", {})


async def consume_oauth_state(state: str) -> Tuple[bool, Optional[str], str]:
    """Validate and delete state — returns (valid, tenant_id, intent).

    Single-use by construction: the row is DELETEd as it is read, so a replayed state
    fails. A 'connect' state must still carry a tenant; a 'login' state carries none.
    """
    row = await execute_one_raw(
        """
        DELETE FROM oauth_states
        WHERE state = :state
          AND expires_at > NOW()
          AND (intent = 'login' OR tenant_id IS NOT NULL)
        RETURNING state, tenant_id, intent
        """,
        {"state": state},
    )
    if not row:
        return False, None, "connect"
    tenant_id = str(row["tenant_id"]) if row.get("tenant_id") else None
    return True, tenant_id, row.get("intent") or "connect"



def get_auth_url_sync() -> str:
    """Synchronous variant — returns URL without storing state (use get_auth_url for async)."""
    state = secrets.token_hex(16)
    params = {
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
        "scope": oauth_scopes(),
        "state": state,
    }
    return f"{LINKEDIN_AUTH_URL}?{urllib.parse.urlencode(params)}"


async def get_auth_url(
    tenant_id: Optional[str] = DEFAULT_TENANT_ID, intent: str = "connect"
) -> str:
    state = secrets.token_hex(16)
    await _store_oauth_state(state, None if intent == "login" else tenant_id, intent)

    params = {
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
        "scope": oauth_scopes(),
        "state": state,
    }
    return f"{LINKEDIN_AUTH_URL}?{urllib.parse.urlencode(params)}"


async def _upsert_tenant_account(
    *,
    tenant_id: str,
    member_urn: str,
    display_name: Optional[str],
    email: Optional[str],
    encrypted_token: str,
    expires_in: int,
) -> Dict[str, Any]:
    existing = await execute_one_raw(
        """
        SELECT id, member_urn FROM linkedin_accounts
        WHERE tenant_id = CAST(:tid AS uuid)
        ORDER BY disconnected_at NULLS FIRST, updated_at DESC NULLS LAST, id DESC
        LIMIT 1
        """,
        {"tid": tenant_id},
    )
    if existing:
        row = await execute_one_raw(
            """
            UPDATE linkedin_accounts
            SET member_urn = :member_urn,
                display_name = COALESCE(:display_name, display_name),
                email = COALESCE(:email, email),
                access_token_enc = :access_token_enc,
                expires_at = NOW() + INTERVAL '1 second' * :expires_in,
                disconnected_at = NULL,
                updated_at = NOW()
            WHERE id = :id
            RETURNING id, member_urn, display_name, email, expires_at, tenant_id, disconnected_at
            """,
            {
                "id": existing["id"],
                "member_urn": member_urn,
                "display_name": display_name,
                "email": email,
                "access_token_enc": encrypted_token,
                "expires_in": expires_in,
            },
        )
        return row or {}

    row = await execute_one_raw(
        """
        INSERT INTO linkedin_accounts (
          tenant_id, member_urn, display_name, email, access_token_enc, expires_at, disconnected_at
        )
        VALUES (
          CAST(:tid AS uuid), :member_urn, :display_name, :email, :access_token_enc,
          NOW() + INTERVAL '1 second' * :expires_in, NULL
        )
        RETURNING id, member_urn, display_name, email, expires_at, tenant_id, disconnected_at
        """,
        {
            "tid": tenant_id,
            "member_urn": member_urn,
            "display_name": display_name,
            "email": email,
            "access_token_enc": encrypted_token,
            "expires_in": expires_in,
        },
    )
    return row or {}


async def exchange_code(code: str) -> Tuple[str, int, Dict[str, Any]]:
    """Trade an authorization code for a token and the OIDC userinfo claims.

    Split out of handle_callback so the sign-in flow can learn who the person is
    BEFORE it knows which tenant to write to -- at that point the tenant may not
    exist yet.

    Returns (access_token, expires_in, userinfo).
    """
    token_params = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "client_secret": settings.LINKEDIN_CLIENT_SECRET,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        token_res = await client.post(
            LINKEDIN_TOKEN_URL,
            data=token_params,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_res.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"LinkedIn token exchange failed: {token_res.text}",
            )

        token_data = token_res.json()
        access_token = token_data.get("access_token")
        expires_in = token_data.get("expires_in", 5184000)

        userinfo_res = await client.get(
            LINKEDIN_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_res.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"LinkedIn userinfo request failed: {userinfo_res.text}",
            )
        userinfo = userinfo_res.json()

    return access_token, expires_in, userinfo


async def persist_connection(
    *,
    tenant_id: str,
    access_token: str,
    expires_in: int,
    userinfo: Dict[str, Any],
) -> Dict[str, Any]:
    """Store the LinkedIn account against a tenant and sync its publish destinations."""
    sub = userinfo.get("sub")
    name = userinfo.get("name")
    email = userinfo.get("email")
    member_urn = f"urn:li:person:{sub}"
    encrypted_token = encrypt(access_token)

    prev = await execute_one_raw(
        """
        SELECT member_urn FROM linkedin_accounts
        WHERE tenant_id = CAST(:tid AS uuid)
        ORDER BY disconnected_at NULLS FIRST, updated_at DESC NULLS LAST, id DESC
        LIMIT 1
        """,
        {"tid": tenant_id},
    )
    different_member = bool(prev and prev.get("member_urn") and prev["member_urn"] != member_urn)

    if different_member:
        from app.services.linkedin_destinations import soft_archive_all_destinations

        await soft_archive_all_destinations(tenant_id)

    account = await _upsert_tenant_account(
        tenant_id=tenant_id,
        member_urn=member_urn,
        display_name=name,
        email=email,
        encrypted_token=encrypted_token,
        expires_in=expires_in,
    )

    from app.services.linkedin_destinations import sync_destinations

    sync_result = await sync_destinations(
        tenant_id=tenant_id,
        access_token=access_token,
        member_urn=member_urn,
        display_name=name,
    )

    result = dict(account or {})
    result["tenant_id"] = tenant_id
    result["sync"] = {
        "destination_count": len(sync_result.get("destinations") or []),
        "acl_error": sync_result.get("acl_error"),
    }
    return result


async def handle_callback(code: str, state: str) -> Dict[str, Any]:
    """Connect-intent callback: attach LinkedIn to the tenant the flow started from."""
    valid, tenant_id, _intent = await consume_oauth_state(state)
    if not valid:
        if settings.NODE_ENV != "development":
            raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")
        tenant_id = DEFAULT_TENANT_ID

    assert tenant_id is not None

    access_token, expires_in, userinfo = await exchange_code(code)
    return await persist_connection(
        tenant_id=tenant_id,
        access_token=access_token,
        expires_in=expires_in,
        userinfo=userinfo,
    )


async def get_stored_account(tenant_id: str = DEFAULT_TENANT_ID) -> Optional[Dict[str, Any]]:
    sql = """
    SELECT id, member_urn, display_name, email, expires_at, tenant_id, disconnected_at, updated_at
    FROM linkedin_accounts
    WHERE tenant_id = CAST(:tid AS uuid)
      AND disconnected_at IS NULL
    ORDER BY updated_at DESC NULLS LAST, id DESC
    LIMIT 1
    """
    return await execute_one_raw(sql, {"tid": tenant_id})


async def get_decrypted_token(tenant_id: str = DEFAULT_TENANT_ID) -> str:
    sql = """
    SELECT access_token_enc, expires_at, disconnected_at
    FROM linkedin_accounts
    WHERE tenant_id = CAST(:tid AS uuid)
      AND disconnected_at IS NULL
    ORDER BY updated_at DESC NULLS LAST, id DESC
    LIMIT 1
    """
    row = await execute_one_raw(sql, {"tid": tenant_id})
    if not row:
        raise HTTPException(status_code=401, detail="No LinkedIn account connected")

    from datetime import datetime, timezone

    expires_at = row["expires_at"]
    if expires_at:
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            except ValueError:
                expires_at = None
        if expires_at:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > expires_at:
                raise HTTPException(
                    status_code=401,
                    detail="LinkedIn token expired — please reconnect your account",
                )
    return decrypt(row["access_token_enc"])


def get_linkedin_headers(token: str, linked_in_version: Optional[str] = None) -> Dict[str, str]:
    version = linked_in_version or settings.LINKEDIN_API_VERSION or "202608"
    return {
        "Authorization": f"Bearer {token}",
        "LinkedIn-Version": version,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
    }


async def upload_image_to_linkedin(
    image_bytes: bytes,
    author_urn: str,
    tenant_id: str = DEFAULT_TENANT_ID,
) -> str:
    token = await get_decrypted_token(tenant_id)
    headers = get_linkedin_headers(token)

    init_body = {"initializeUploadRequest": {"owner": author_urn}}
    async with httpx.AsyncClient(timeout=60.0) as client:
        init_res = await client.post(
            f"{LINKEDIN_API_BASE}/rest/images?action=initializeUpload",
            json=init_body,
            headers=headers,
        )
        init_res.raise_for_status()
        val = init_res.json().get("value", {})
        upload_url = val.get("uploadUrl")
        image_urn = val.get("image")

        put_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/octet-stream",
        }
        put_res = await client.put(upload_url, content=image_bytes, headers=put_headers)
        put_res.raise_for_status()

    return image_urn


async def create_linkedin_post(
    text: str,
    author_urn: str,
    image_urn: Optional[str] = None,
    tenant_id: str = DEFAULT_TENANT_ID,
) -> str:
    token = await get_decrypted_token(tenant_id)
    headers = get_linkedin_headers(token)

    body: Dict[str, Any] = {
        "author": author_urn,
        "commentary": text,
        "visibility": "PUBLIC",
        "distribution": {
            "feedDistribution": "MAIN_FEED",
            "targetEntities": [],
            "thirdPartyDistributionChannels": [],
        },
        "lifecycleState": "PUBLISHED",
    }

    if image_urn:
        body["content"] = {
            "media": {
                "id": image_urn,
                "title": "Post image",
            }
        }

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            f"{LINKEDIN_API_BASE}/rest/posts",
            json=body,
            headers=headers,
        )
        if res.status_code >= 400:
            detail = res.text[:500]
            logger.error(
                "[LinkedIn] create post failed status=%s version=%s body=%s",
                res.status_code,
                headers.get("LinkedIn-Version"),
                detail,
            )
            raise HTTPException(
                status_code=502,
                detail=f"LinkedIn API error {res.status_code}: {detail}",
            )
        post_urn = res.headers.get("x-restli-id") or res.headers.get("x-linkedin-id") or ""
        return post_urn


async def get_post_engagement(
    post_urn: str,
    tenant_id: str = DEFAULT_TENANT_ID,
) -> Optional[Dict[str, int]]:
    try:
        token = await get_decrypted_token(tenant_id)
        encoded_urn = urllib.parse.quote(post_urn)
        headers = get_linkedin_headers(token)

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(
                f"{LINKEDIN_API_BASE}/rest/posts/{encoded_urn}/analytics",
                headers=headers,
                params={"timeIntervals": "LAST_30_DAYS"},
            )
            if res.status_code in (401, 403):
                logger.warning(
                    "[LinkedIn] Analytics API not available (403/401) — manual entry required"
                )
                return None
            res.raise_for_status()
            data = res.json().get("elements", [{}])[0]
            if not data:
                return None
            return {
                "likes": data.get("likeCount", 0),
                "comments": data.get("commentCount", 0),
                "shares": data.get("shareCount", 0),
                "impressions": data.get("impressionCount", 0),
            }
    except Exception as e:
        logger.warning(f"[LinkedIn] Could not fetch post analytics: {e}")
        return None


async def download_image_buffer(url: str) -> bytes:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(url)
        res.raise_for_status()
        return res.content
