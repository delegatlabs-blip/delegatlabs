def ensure_trailing_slash(path: str) -> str:
    return path if path.endswith("/") else f"{path}/"
