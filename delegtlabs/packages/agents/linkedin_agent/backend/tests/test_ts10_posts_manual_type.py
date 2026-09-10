"""TS-10 type-gate HTTP tests from C-posts-manual + AC-TYPE-* + Wave 3 locks.

Auth: TestClient + require_auth / get_auth_context override (same pattern as TS-8).
Does not assert LinkedIn publish 200. Does not require a friendly oversize toast.
"""
from __future__ import annotations

import pytest

from tests.ts10_helpers import (
    DISALLOWED_TYPE_CASES,
    TYPE_DETAIL,
    post_manual,
)


def _assert_type_reject(response) -> None:
    assert response.status_code == 400
    assert response.status_code != 413
    body = response.json()
    assert body == {"detail": TYPE_DETAIL}


@pytest.mark.parametrize(
    "filename,content,content_type",
    DISALLOWED_TYPE_CASES,
    ids=("gif", "webp", "image_jpg", "empty_type"),
)
def test_ac_type_05_disallowed_declared_type_is_400(
    posts_client, filename, content, content_type
):
    """AC-TYPE-05 / Wave 3 Type HTTP: GIF, WebP, image/jpg, empty type + filename → 400."""
    response = post_manual(
        posts_client, image=(filename, content, content_type)
    )
    _assert_type_reject(response)


def test_ac_type_01_gif_not_persisted_under_uploads(posts_client, tmp_path, monkeypatch):
    """AC-TYPE-01/05: GIF reject must not persist under uploads/ (must not remap to .png)."""
    monkeypatch.chdir(tmp_path)
    uploads = tmp_path / "uploads"
    before = set(uploads.iterdir()) if uploads.is_dir() else set()

    response = post_manual(
        posts_client, image=("anim.gif", b"GIF89a-not-a-real-gif", "image/gif")
    )
    _assert_type_reject(response)

    if uploads.is_dir():
        after = set(uploads.iterdir())
        created = after - before
        assert not created, f"GIF must not be written under uploads/: {created}"


def test_ac_type_02_webp_not_persisted_under_uploads(posts_client, tmp_path, monkeypatch):
    """AC-TYPE-02/05: WebP reject must not persist under uploads/."""
    monkeypatch.chdir(tmp_path)
    uploads = tmp_path / "uploads"
    before = set(uploads.iterdir()) if uploads.is_dir() else set()

    response = post_manual(
        posts_client, image=("pic.webp", b"RIFF-not-a-real-webp", "image/webp")
    )
    _assert_type_reject(response)

    if uploads.is_dir():
        after = set(uploads.iterdir())
        created = after - before
        assert not created, f"WebP must not be written under uploads/: {created}"


@pytest.mark.parametrize(
    "filename,content,content_type",
    (
        ("photo.jpg", b"not-sniffed-jpeg", "image/jpeg"),
        ("photo.png", b"not-sniffed-png", "image/png"),
        ("photo.jpg", b"not-sniffed-jpeg", "IMAGE/JPEG"),
        ("photo.png", b"not-sniffed-png", " image/png "),
        ("photo.jpg", b"not-sniffed-jpeg", "image/jpeg; charset=binary"),
    ),
    ids=("jpeg", "png", "jpeg_upper", "png_stripped", "jpeg_params"),
)
def test_ac_type_06_jpeg_png_are_not_type_rejected(
    posts_client, filename, content, content_type
):
    """AC-TYPE-06 / AC-HP in-policy type: image/jpeg and image/png are not the type 400.

    Publish success is out of scope. 401 would mean auth override failed.
    500 after the type gate is still not a type reject.
    """
    response = post_manual(
        posts_client, image=(filename, content, content_type)
    )
    assert response.status_code != 401
    if response.status_code == 400:
        assert response.json().get("detail") != TYPE_DETAIL
    else:
        assert response.status_code != 400


def test_ac_type_03_other_non_jpeg_png_is_400(posts_client):
    """AC-TYPE-03: any declared type that is not image/jpeg or image/png is type-rejected."""
    response = post_manual(
        posts_client, image=("doc.pdf", b"%PDF-not-real", "application/pdf")
    )
    _assert_type_reject(response)


def test_ac_type_05_disallowed_is_not_nginx_413(posts_client):
    """AC-TYPE-05: type reject is not nginx HTML 413."""
    response = post_manual(
        posts_client, image=("anim.gif", b"GIF89a-not-a-real-gif", "image/gif")
    )
    assert response.status_code != 413
    assert "413 Request Entity Too Large" not in response.text
    assert response.headers.get("content-type", "").startswith("application/json")
