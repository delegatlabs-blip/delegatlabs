"""TS-10 ACs that require a live USER nginx hop or browser. Not unit-assertable here.

AC-HP-01 (~1.5 MiB JPEG/PNG through :3005 is not nginx 413) is the Wave 4 live curl.
No test here requires a friendly oversize toast (AC-SIZE-03 forbids that).
"""
from __future__ import annotations

import pytest

WAVE4 = "Wave 4 live curl / browser — not a unit assertion (AC-HP-01 nginx 413 hop)"


@pytest.mark.skip(reason=WAVE4)
def test_ac_hp_01_wave4_15mib_jpeg_png_through_user_3005_is_not_nginx_413():
    """AC-HP-01: POST ~1.5 MiB (1572864 file bytes) JPEG/PNG to localhost:3005/posts/manual
    must not return nginx HTML 413. Unauth pass = 401 {"detail":"Unauthorized — no valid session"}.
    """


@pytest.mark.skip(reason=WAVE4)
def test_ac_hp_02_wave4_in_policy_generate_does_not_toast_axios_413():
    """AC-HP-02: authenticated Generate Post with in-policy JPEG/PNG must not toast
    `Request failed with status code 413`. LinkedIn publish 200 is not required.
    """


@pytest.mark.skip(reason=WAVE4)
def test_ac_hp_06_wave4_authenticated_in_policy_upload_through_3005():
    """AC-HP-06 / TS-10-U3: authenticated in-policy JPEG/PNG POST /posts/manual
    through USER :3005 after the nginx raise. Status is not 413.
    """


@pytest.mark.skip(reason=WAVE4)
def test_ac_type_01_wave4_gif_friendly_type_toast_in_browser():
    """AC-TYPE-01 (browser): GIF Generate Post toasts the type rule, not axios 413.
    Unit coverage of the HTTP 400 is in test_ts10_posts_manual_type.py.
    """


@pytest.mark.skip(reason=WAVE4)
def test_ac_gate_02_wave4_generate_post_evidence_bundle():
    """AC-GATE-02: verification-gate attaches the four live evidence items
    (1.5 MiB :3005, in-policy no 413 toast, GIF type toast, text-only).
    """
