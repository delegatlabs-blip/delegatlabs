"""Allowlist sanitizer for Improve HTML (C-posts-improve §7). Stdlib only."""

from html import escape, unescape
from html.parser import HTMLParser
from urllib.parse import urlparse

_ALLOWED_TAGS = frozenset({"p", "br", "strong", "em", "ul", "ol", "li", "a"})
_DROP_INNER_TAGS = frozenset({"script", "style", "iframe", "object", "svg"})
_BLOCK_PLAIN = frozenset({"p", "li"})


def _href_ok(href: str | None) -> bool:
    if href is None:
        return False
    value = href.strip()
    if not value:
        return False
    if value.startswith("//"):
        return False
    parsed = urlparse(value)
    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        return False
    # Reject http:javascript:alert(1) — urlparse scheme is "http" but netloc is empty.
    return bool(parsed.netloc)


class _AllowlistParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._chunks: list[str] = []
        self._open: list[tuple[str, bool]] = []
        self._drop_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        name = tag.lower()
        if self._drop_depth:
            if name in _DROP_INNER_TAGS:
                self._drop_depth += 1
            return
        if name in _DROP_INNER_TAGS:
            self._drop_depth = 1
            return
        if name not in _ALLOWED_TAGS:
            return
        if name == "br":
            self._chunks.append("<br>")
            return
        if name == "a":
            href = None
            for key, val in attrs:
                if key.lower() == "href":
                    href = val
                    break
            if href is not None and _href_ok(href):
                self._chunks.append(f'<a href="{escape(href.strip(), quote=True)}">')
                self._open.append(("a", True))
            else:
                self._open.append(("a", False))
            return
        self._chunks.append(f"<{name}>")
        self._open.append((name, True))

    def handle_endtag(self, tag: str) -> None:
        name = tag.lower()
        if self._drop_depth:
            if name in _DROP_INNER_TAGS:
                self._drop_depth = max(0, self._drop_depth - 1)
            return
        if name == "br" or name not in _ALLOWED_TAGS:
            return
        idx = None
        for i in range(len(self._open) - 1, -1, -1):
            if self._open[i][0] == name:
                idx = i
                break
        if idx is None:
            return
        while len(self._open) > idx:
            opened, emit = self._open.pop()
            if emit:
                self._chunks.append(f"</{opened}>")

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        name = tag.lower()
        if name == "br":
            self.handle_starttag(tag, attrs)
            return
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_data(self, data: str) -> None:
        if self._drop_depth or not data:
            return
        self._chunks.append(escape(data, quote=False))

    def handle_comment(self, data: str) -> None:
        return

    def close(self) -> None:
        super().close()
        while self._open:
            opened, emit = self._open.pop()
            if emit:
                self._chunks.append(f"</{opened}>")

    def result(self) -> str:
        return "".join(self._chunks)


class _PlainParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._chunks: list[str] = []
        self._drop_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        name = tag.lower()
        if self._drop_depth:
            if name in _DROP_INNER_TAGS:
                self._drop_depth += 1
            return
        if name in _DROP_INNER_TAGS:
            self._drop_depth = 1
            return
        if name == "br":
            self._chunks.append("\n")

    def handle_endtag(self, tag: str) -> None:
        name = tag.lower()
        if self._drop_depth:
            if name in _DROP_INNER_TAGS:
                self._drop_depth = max(0, self._drop_depth - 1)
            return
        if name in _BLOCK_PLAIN:
            self._chunks.append("\n")

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag.lower() != "br":
            self.handle_endtag(tag)

    def handle_data(self, data: str) -> None:
        if self._drop_depth or not data:
            return
        self._chunks.append(data)

    def result(self) -> str:
        return unescape("".join(self._chunks))


def sanitize_improve_html(raw: str) -> str:
    parser = _AllowlistParser()
    parser.feed(raw or "")
    parser.close()
    return parser.result()


def html_to_plain(html: str) -> str:
    parser = _PlainParser()
    parser.feed(html or "")
    parser.close()
    return parser.result()
