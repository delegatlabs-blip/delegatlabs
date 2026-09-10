"""TS-10 USER Post Generation source ACs (no Jest/Vitest runner; same pattern as TS-8).

Interactive toast/click ACs are Wave 4 live (see test_ts10_wave4_deferred.py).
Does not require a friendly oversize toast.
"""
from __future__ import annotations

import re
from pathlib import Path

from tests.ts8_helpers import FRONTEND_ROOT, collect_docs_text

USER_SRC = FRONTEND_ROOT / "user" / "src"
SHARED_API = FRONTEND_ROOT / "shared" / "api"

TYPE_TOAST = "Image must be JPEG or PNG"


def _text(path: Path) -> str:
    return path.read_text() if path.is_file() else ""


def _first(name: str, root: Path) -> Path | None:
    hits = list(root.rglob(name))
    return hits[0] if hits else None


def _read_named(name: str, root: Path) -> str:
    path = _first(name, root)
    return _text(path) if path else ""


def _glob_text(root: Path, pattern: str) -> str:
    if not root.is_dir():
        return ""
    return "\n".join(p.read_text() for p in root.rglob(pattern) if p.is_file())


def _accept_values(src: str) -> list[str]:
    found = re.findall(r"accept=\{?['\"]([^'\"]+)['\"]\}?", src)
    found += re.findall(r'accept=["\']([^"\']+)["\']', src)
    for name in re.findall(r"accept=\{([A-Za-z_][A-Za-z0-9_]*)\}", src):
        assigned = re.search(
            rf"(?:const|let|var)\s+{re.escape(name)}\s*=\s*['\"]([^'\"]+)['\"]",
            src,
        )
        if assigned:
            found.append(assigned.group(1))
            continue
        # Const may live in the same user/src tree (not inlined on the input).
        blob = _glob_text(USER_SRC, "*.ts*")
        assigned = re.search(
            rf"(?:const|export\s+const|let|var)\s+{re.escape(name)}\s*=\s*['\"]([^'\"]+)['\"]",
            blob,
        )
        if assigned:
            found.append(assigned.group(1))
    return found


def test_ac_type_04_file_input_accept_is_jpeg_png_only():
    """AC-TYPE-04: Post Generation file input accept is not image/* and does not list GIF/WebP."""
    src = _read_named("PostGenerationTab.tsx", USER_SRC)
    assert src, "PostGenerationTab.tsx missing"
    assert 'accept="image/*"' not in src
    assert "accept='image/*'" not in src
    assert 'accept={"image/*"}' not in src
    assert "accept={'image/*'}" not in src
    values = _accept_values(src)
    assert values, "file input must advertise an accept set"
    for val in values:
        assert "image/*" not in val
        assert "image/gif" not in val
        assert "image/webp" not in val
        assert (
            "image/jpeg" in val
            or "image/png" in val
            or ".jpg" in val
            or ".jpeg" in val
            or ".png" in val
        )


def test_ac_type_toast_copy_locked_not_axios_413():
    """AC-TYPE-01..03 source: Wave 3 lock exact type toast; not used as an oversize toast."""
    src = _read_named("PostGenerationTab.tsx", USER_SRC)
    assert src, "PostGenerationTab.tsx missing"
    assert TYPE_TOAST in src
    # Oversize may still surface axios 413 (AC-SIZE-03). Type toast must be the type rule.
    assert "JPEG" in src and "PNG" in src


def test_ac_size_01_no_new_ui_size_check():
    """AC-SIZE-01 / Q-3 A: no client File.size compare to 10 MiB that aborts Generate."""
    src = _read_named("PostGenerationTab.tsx", USER_SRC)
    api = _glob_text(SHARED_API, "*.ts")
    blob = src + "\n" + api
    assert "10485760" not in blob
    assert "10 * 1024 * 1024" not in blob
    assert "10*1024*1024" not in blob
    assert not re.search(r"file\.size\s*[<>=!]", blob, re.I)
    assert not re.search(r"\.size\s*[<>=!].{0,20}10", blob)


def test_ac_hp_03_generate_post_calls_posts_manual_not_generate():
    """AC-HP-03 / AC-ENC-01: Generate Post uses postsApi.manualPublish → POST /posts/manual."""
    src = _read_named("PostGenerationTab.tsx", USER_SRC)
    api = _glob_text(SHARED_API, "*.ts")
    assert src and api
    assert "manualPublish" in src
    assert "/posts/manual" in api
    assert "postsApi.generate" not in src
    # Generate Post must not be switched to /posts/generate
    assert not re.search(r"""['\"]/posts/generate['\"]""", src)


def test_ac_enc_01_multipart_field_remains_image_not_base64():
    """AC-ENC-01: upload stays multipart field `image`, not a base64 JSON field."""
    src = _read_named("PostGenerationTab.tsx", USER_SRC)
    api = _glob_text(SHARED_API, "*.ts")
    blob = src + "\n" + api
    assert "manualPublish" in blob
    assert "/posts/manual" in api
    assert "FormData" in src or "formData" in src or "FormData" in api
    assert not re.search(r"readAsDataURL|btoa\(|base64", src, re.I)


def test_ac_enc_03_axios_timeout_not_replaced_by_max_body():
    """AC-ENC-03: manualPublish stays POST /posts/manual + FormData; no maxContentLength size policy."""
    api = _glob_text(SHARED_API, "*.ts")
    assert "manualPublish" in api
    assert "/posts/manual" in api
    assert "timeout: 120000" in api
    # Q-3 A: do not add axios max-body as the Q-1 cap
    assert "maxContentLength" not in api
    assert "maxBodyLength" not in api


def test_ac_hp_05_tags_remain_optional_in_client():
    """AC-HP-05: optional tags still exist as a form string; tags are not required."""
    src = _read_named("PostGenerationTab.tsx", USER_SRC)
    assert src
    assert re.search(r"\btags\b", src)


def test_ac_oos_03_user_overview_stays_removed():
    """AC-OOS-03: USER Overview remains removed (TS-8)."""
    sidebar = _read_named("UserSidebar.tsx", USER_SRC)
    app = _read_named("App.tsx", USER_SRC)
    assert sidebar and app
    assert not re.search(r'label:\s*["\']Overview["\']', sidebar)
    assert "<TenantOverview" not in app


def test_ac_oos_04_no_matchifyx_leadgen_payment_change_in_generation():
    """AC-OOS-04: Post Generation task must not add Matchifyx / payment / Lead Gen product code."""
    src = _read_named("PostGenerationTab.tsx", USER_SRC)
    assert "Matchifyx" not in src
    assert "GraphRAG" not in src
    assert "Razorpay" not in src
    assert "Stripe" not in src


def test_ac_doc_01_docs_state_jpeg_png_and_10m_and_413():
    """AC-DOC-01: changelog/docs state JPEG+PNG only, USER nginx 10m, oversize may be 413."""
    docs = collect_docs_text()
    assert docs, "no README/CHANGELOG/STRUCTURE under agent package"
    lower = docs.lower()
    assert "jpeg" in lower and "png" in lower
    assert "10m" in lower or "10 mib" in lower
    assert "413" in lower
    assert "nginx" in lower
