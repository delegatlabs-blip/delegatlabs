"""TS-11 sanitizer ACs from C-posts-improve §7 (not from html_allowlist.py source).

Importing app.services.html_allowlist after the module exists is required.
If the import fails, these tests fail (correct — module is in the locked contract).
"""
from __future__ import annotations


def _load():
    from app.services.html_allowlist import html_to_plain, sanitize_improve_html

    return sanitize_improve_html, html_to_plain


def test_import_html_allowlist_succeeds():
    """C-posts-improve §7: sanitize_improve_html and html_to_plain are importable."""
    sanitize_improve_html, html_to_plain = _load()
    assert callable(sanitize_improve_html)
    assert callable(html_to_plain)


def test_javascript_href_stripped():
    """§7: javascript: href is dropped (unwrap <a> to text)."""
    sanitize_improve_html, _ = _load()
    out = sanitize_improve_html('<p><a href="javascript:alert(1)">Click</a></p>')
    assert "javascript:" not in out.lower()
    assert "alert(1)" not in out
    assert "Click" in out


def test_http_colon_javascript_href_stripped():
    """§7: http:javascript: must not keep an href (urlparse scheme is http)."""
    sanitize_improve_html, _ = _load()
    out = sanitize_improve_html('<p><a href="http:javascript:alert(1)">Click</a></p>')
    assert "javascript:" not in out.lower()
    assert "alert(1)" not in out
    assert "<a " not in out.lower()
    assert "Click" in out


def test_data_and_vbscript_href_stripped():
    """§7: data: and vbscript: hrefs are not kept."""
    sanitize_improve_html, _ = _load()
    data_out = sanitize_improve_html('<a href="data:text/html,hi">X</a>')
    vb_out = sanitize_improve_html('<a href="vbscript:msgbox(1)">Y</a>')
    assert "data:" not in data_out.lower()
    assert "vbscript:" not in vb_out.lower()
    assert "X" in data_out
    assert "Y" in vb_out


def test_protocol_relative_href_stripped():
    """§7: protocol-relative href is dropped."""
    sanitize_improve_html, _ = _load()
    out = sanitize_improve_html('<a href="//evil.example/x">Z</a>')
    assert "evil.example" not in out
    assert "Z" in out


def test_script_style_iframe_dropped_including_inner_text():
    """§7: script/style/iframe/object/svg drop tag and inner text."""
    sanitize_improve_html, _ = _load()
    raw = (
        "<p>keep</p>"
        "<script>alert(1)</script>"
        "<style>body{color:red}</style>"
        "<iframe src='https://evil.example'></iframe>"
        "<object data='x'></object>"
        "<svg><text>nope</text></svg>"
    )
    out = sanitize_improve_html(raw)
    lower = out.lower()
    assert "keep" in out
    assert "script" not in lower
    assert "alert(1)" not in out
    assert "iframe" not in lower
    assert "object" not in lower
    assert "<svg" not in lower
    assert "nope" not in out


def test_allowlist_tags_kept():
    """§7: p, br, strong, em, ul, ol, li, a (http/https href) are kept."""
    sanitize_improve_html, _ = _load()
    raw = (
        "<p>para</p><br><strong>b</strong><em>i</em>"
        "<ul><li>u</li></ul><ol><li>o</li></ol>"
        '<a href="https://example.com/x">link</a>'
        '<a href="http://example.com/y">link2</a>'
    )
    out = sanitize_improve_html(raw)
    lower = out.lower()
    assert "para" in out
    assert "<p" in lower
    assert "strong" in lower
    assert "em" in lower
    assert "ul" in lower and "li" in lower
    assert "ol" in lower
    assert "https://example.com/x" in out
    assert "http://example.com/y" in out
    assert "<a" in lower


def test_other_attributes_dropped():
    """§7: class, id, style, target, on* are dropped; href on <a> is the only attr."""
    sanitize_improve_html, _ = _load()
    out = sanitize_improve_html(
        '<p class="x" id="y" style="color:red" onclick="evil()">t</p>'
        '<a href="https://ok.example" target="_blank" onclick="evil()">L</a>'
    )
    lower = out.lower()
    assert "t" in out
    assert "onclick" not in lower
    assert "style=" not in lower
    assert 'class="' not in lower
    assert 'id="y"' not in lower
    assert "target=" not in lower
    assert "https://ok.example" in out


def test_html_to_plain_br_and_blocks_become_newlines():
    """§7: br → newline; end of p/li → newline; tags stripped; entities unescaped."""
    _, html_to_plain = _load()
    plain = html_to_plain("<p>A</p><br><ul><li>B</li></ul>")
    assert "A" in plain and "B" in plain
    assert "<p>" not in plain and "<li>" not in plain
    assert "\n" in plain
    decoded = html_to_plain("<p>Tom &amp; Jerry</p>")
    assert "&amp;" not in decoded
    assert "Tom" in decoded and "Jerry" in decoded
