"""TS-10 nginx / size-policy file-content tests (AC-NGX-*, AC-SIZE-*, AC-ENC-02).

USER/ADMIN nginx.conf are policy artifacts (AC-NGX). No test requires a friendly
oversize toast. No test asserts that a 10 MiB file part must 2xx (AC-SIZE-04).
"""
from __future__ import annotations

from tests.ts8_helpers import BACKEND_ROOT
from tests.ts10_helpers import ADMIN_NGINX, USER_NGINX, active_nginx_lines


def test_ac_ngx_01_user_nginx_has_client_max_body_size_10m():
    """AC-NGX-01 / SQ-1: USER nginx active directive is exactly client_max_body_size 10m;"""
    assert USER_NGINX.is_file(), f"missing {USER_NGINX}"
    text = USER_NGINX.read_text()
    active = active_nginx_lines(text)
    assert any(
        line == "client_max_body_size 10m;" or line.endswith("client_max_body_size 10m;")
        for line in active
    ), "USER nginx must contain active `client_max_body_size 10m;` (not comment-only)"
    # SQ-1: in the server block after `index index.html;`
    joined = "\n".join(active)
    index_at = joined.find("index index.html;")
    size_at = joined.find("client_max_body_size 10m;")
    assert index_at != -1
    assert size_at != -1
    assert size_at > index_at


def test_ac_ngx_02_admin_nginx_has_no_client_max_body_size():
    """AC-NGX-02 / Q-4 A: ADMIN nginx must not gain client_max_body_size."""
    assert ADMIN_NGINX.is_file(), f"missing {ADMIN_NGINX}"
    text = ADMIN_NGINX.read_text()
    assert "client_max_body_size" not in text


def test_ac_ngx_04_no_other_hop_limit_raise():
    """AC-NGX-04: uvicorn start.sh / FastAPI app construction are not the size-policy raise."""
    start = (BACKEND_ROOT / "start.sh").read_text() if (BACKEND_ROOT / "start.sh").is_file() else ""
    main = (BACKEND_ROOT / "app" / "main.py").read_text() if (BACKEND_ROOT / "app" / "main.py").is_file() else ""
    for blob in (start, main):
        for token in ("client_max_body_size", "max_body_size", "max_part_size", "10485760"):
            assert token not in blob


def test_ac_size_02_posts_manual_has_no_new_api_byte_cap():
    """AC-SIZE-02 / Q-3 A: POST /posts/manual must not add an application-layer image byte cap."""
    posts = BACKEND_ROOT / "app" / "api" / "endpoints" / "posts.py"
    src = posts.read_text() if posts.is_file() else ""
    assert src, "posts.py missing"
    lower = src.lower()
    for token in ("10485760", "10 * 1024 * 1024", "10*1024*1024"):
        assert token not in src
    assert "client_max_body_size" not in src
    assert "max_body_size" not in src
    assert "max_part_size" not in src
    # Type reject is allowed; a new "too large" / 413 from the app is not.
    assert "request entity too large" not in lower
    assert "status_code=413" not in src
    assert "status_code = 413" not in src


def test_ac_enc_02_no_new_limit_env_var():
    """AC-ENC-02: 10m cap is USER nginx only — no new named env var for the limit."""
    settings = BACKEND_ROOT / "app" / "core" / "config.py"
    env_example = BACKEND_ROOT / ".env.example"
    settings_src = settings.read_text() if settings.is_file() else ""
    env_src = env_example.read_text() if env_example.is_file() else ""
    blob = settings_src + "\n" + env_src
    for name in (
        "CLIENT_MAX_BODY_SIZE",
        "MAX_UPLOAD_BYTES",
        "MAX_IMAGE_BYTES",
        "IMAGE_MAX_BYTES",
        "UPLOAD_MAX_BYTES",
        "NGINX_CLIENT_MAX_BODY_SIZE",
    ):
        assert name not in blob
    assert "10485760" not in blob
    assert "client_max_body_size" not in blob


def test_ac_size_03_does_not_require_friendly_oversize_toast():
    """AC-SIZE-03: oversize >10m may remain nginx/axios 413. This is not a toast assertion."""
    # Policy lock only: USER 10m is the size gate. No friendly oversize toast is required.
    text = USER_NGINX.read_text()
    assert any(
        "client_max_body_size 10m;" in line for line in active_nginx_lines(text)
    )


def test_ac_size_04_no_ten_mib_file_must_succeed_rule():
    """AC-SIZE-04: in-policy is body accepted at 10m, not file_bytes <= 10485760 ⇒ 2xx.

    Intentionally does not POST a 10 MiB file or assert nginx success for that file part.
    """
    assert True
