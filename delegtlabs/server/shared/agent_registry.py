import json
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def _find_agents_dir() -> Path:
    # Check explicitly set environment variable first
    env_dir = os.environ.get("AGENTS_DIR")
    if env_dir:
        return Path(env_dir)

    # Climb from current file location to root
    current = Path(__file__).resolve().parent
    for _ in range(5):
        candidate = current / "packages" / "agents"
        if candidate.exists() and candidate.is_dir():
            return candidate
        current = current.parent

    # Default fallback to expected relative path from server/shared
    return Path(__file__).resolve().parent.parent.parent / "packages" / "agents"


class AgentRegistry:
    def __init__(self, agents_dir: Path | None = None) -> None:
        self.agents_dir = agents_dir or _find_agents_dir()
        self._agents: dict[str, dict[str, Any]] = {}
        self.reload()

    def reload(self) -> None:
        self._agents.clear()
        if not self.agents_dir.exists() or not self.agents_dir.is_dir():
            logger.info(f"Agents directory {self.agents_dir} does not exist. No agents registered.")
            return

        for item in self.agents_dir.iterdir():
            if item.is_dir():
                manifest_path = item / "manifest.json"
                if manifest_path.is_file():
                    try:
                        with open(manifest_path, "r", encoding="utf-8") as f:
                            manifest = json.load(f)
                            slug = manifest.get("slug")
                            if slug:
                                manifest["_package_path"] = str(item)
                                self._agents[slug] = manifest
                            else:
                                logger.warning(f"Manifest at {manifest_path} missing 'slug'")
                    except Exception as e:
                        logger.error(f"Error loading manifest at {manifest_path}: {e}")

    def get_registered_agents(self) -> list[dict[str, Any]]:
        return list(self._agents.values())

    def get_agent_manifest(self, slug: str) -> dict[str, Any] | None:
        return self._agents.get(slug)

    def get_worker_entrypoints(self) -> dict[str, str]:
        entrypoints = {}
        for slug, manifest in self._agents.items():
            pkg_path = manifest.get("_package_path")
            if pkg_path:
                worker_path = os.path.join(pkg_path, "backend", "worker.py")
                if os.path.exists(worker_path):
                    entrypoints[slug] = worker_path
        return entrypoints


_registry_instance = AgentRegistry()


def get_registered_agents() -> list[dict[str, Any]]:
    # Re-scan dynamically if needed to ensure newly dropped agent folders are found
    _registry_instance.reload()
    return _registry_instance.get_registered_agents()


def get_agent_manifest(slug: str) -> dict[str, Any] | None:
    return _registry_instance.get_agent_manifest(slug)


def get_worker_entrypoints() -> dict[str, str]:
    return _registry_instance.get_worker_entrypoints()
