import re


def ensure_trailing_slash(path: str) -> str:
    return path if path.endswith("/") else f"{path}/"


def slugify(value: str) -> str:
    text = value.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:80]
