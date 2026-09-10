"""TS-11 ACs that require a live browser / fake timer. Not unit-assertable here.

Source-level coverage lives in test_ts11_frontend_static.py and HTTP tests.
"""
from __future__ import annotations

import pytest

WAVE4 = "Wave 4 browser / fake-timer — not a unit assertion"


@pytest.mark.skip(reason=WAVE4)
def test_ac_hp_01_wave4_tiptap_description_renders_on_generation_tab():
    """AC-HP-01 (browser): Description on TabsContent generation is a TipTap editor
    with bold/italic/lists/links — not the lone Textarea.
    """


@pytest.mark.skip(reason=WAVE4)
def test_ac_hp_05_wave4_dialog_accept_writes_html_discard_restores_snapshot():
    """AC-HP-05 (browser): success opens Dialog; Accept loads response html into TipTap;
    Discard leaves editor HTML byte-identical to the pre-click snapshot.
    """


@pytest.mark.skip(reason=WAVE4)
def test_ac_em_01_wave4_disabled_improve_click_is_noop():
    """AC-EM-01 (browser): both fields empty → Improve disabled; click sends no HTTP.
    """


@pytest.mark.skip(reason=WAVE4)
def test_ac_err_01_wave4_inflight_double_click_does_not_start_second_http():
    """AC-ERR-01 (browser): while Improve is pending, a second click does not start
    another Improve HTTP and the editor is not overwritten.
    """


@pytest.mark.skip(reason=WAVE4)
def test_ac_err_03_wave4_discard_after_preview_leaves_pre_improve_html():
    """AC-ERR-03 (browser): Discard after a successful preview does not keep preview HTML
    in Description.
    """


@pytest.mark.skip(reason=WAVE4)
def test_ac_err_04_wave4_timeout_is_failure_and_does_not_late_write_editor():
    """AC-ERR-04 (browser / fake timer): request exceeding 120000 ms is a failure
    (AC-ERR-02). A late 2xx after timeout must not Accept-write.
    """
