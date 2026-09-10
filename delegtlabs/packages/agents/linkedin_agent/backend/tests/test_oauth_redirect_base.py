"""Regression: the OAuth callback must never take its redirect target from Referer.

The callback is a browser navigation FROM the identity provider, so its Referer names
linkedin.com. Trusting it sent users to https://www.linkedin.com/dashboard after a
successful sign-in, and let any referer-controlling party choose the redirect host.
"""
from __future__ import annotations

from unittest.mock import patch


def test_frontend_base_uses_config_not_referer():
    from app.api.endpoints import auth as auth_ep

    with patch.object(auth_ep.settings, "FRONTEND_URL", "http://localhost:3005"):
        assert auth_ep._frontend_base() == "http://localhost:3005"


def test_frontend_base_strips_trailing_slash():
    from app.api.endpoints import auth as auth_ep

    with patch.object(auth_ep.settings, "FRONTEND_URL", "https://app.example.com/"):
        assert auth_ep._frontend_base() == "https://app.example.com"


def test_frontend_base_falls_back_when_unset():
    from app.api.endpoints import auth as auth_ep

    with patch.object(auth_ep.settings, "FRONTEND_URL", ""):
        assert auth_ep._frontend_base() == "http://localhost:3005"


def test_callback_source_contains_no_referer_lookup():
    """Guards against the referer trust being reintroduced in either OAuth handler."""
    import inspect
    from app.api.endpoints import auth as auth_ep

    for fn in (auth_ep.linkedin_callback, auth_ep.dev_connect):
        source = inspect.getsource(fn)
        code_lines = [
            ln for ln in source.splitlines() if not ln.strip().startswith("#")
        ]
        assert 'headers.get("referer")' not in "\n".join(code_lines), (
            f"{fn.__name__} reads Referer again"
        )
