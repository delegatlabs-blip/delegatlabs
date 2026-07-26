"""Supabase REST helpers via httpx (PostgREST). Falls back when unset."""

from __future__ import annotations

from typing import Any

import httpx

from shared.core.config import settings


class SupabaseRestError(RuntimeError):
    pass


def supabase_ready() -> bool:
    return settings.supabase_configured


def _headers() -> dict[str, str]:
    key = settings.supabase_service_role_key
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _url(path: str) -> str:
    base = settings.supabase_url.rstrip("/")
    return f"{base}/rest/v1/{path.lstrip('/')}"


async def sb_select(
    table: str,
    *,
    params: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(_url(table), headers=_headers(), params=params or {})
        if res.status_code >= 400:
            raise SupabaseRestError(f"select {table} failed: {res.status_code} {res.text}")
        data = res.json()
        return data if isinstance(data, list) else [data]


async def sb_insert(table: str, payload: dict[str, Any]) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(_url(table), headers=_headers(), json=payload)
        if res.status_code >= 400:
            raise SupabaseRestError(f"insert {table} failed: {res.status_code} {res.text}")
        data = res.json()
        return data[0] if isinstance(data, list) else data


async def sb_update(table: str, match: dict[str, str], payload: dict[str, Any]) -> dict[str, Any]:
    params = {k: f"eq.{v}" for k, v in match.items()}
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.patch(_url(table), headers=_headers(), params=params, json=payload)
        if res.status_code >= 400:
            raise SupabaseRestError(f"update {table} failed: {res.status_code} {res.text}")
        data = res.json()
        if isinstance(data, list):
            if not data:
                raise SupabaseRestError(f"update {table}: no rows matched")
            return data[0]
        return data


async def sb_delete(table: str, match: dict[str, str]) -> None:
    params = {k: f"eq.{v}" for k, v in match.items()}
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.delete(_url(table), headers=_headers(), params=params)
        if res.status_code >= 400:
            raise SupabaseRestError(f"delete {table} failed: {res.status_code} {res.text}")
