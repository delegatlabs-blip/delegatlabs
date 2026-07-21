import asyncio
import importlib.util
import logging
import os
import sys

from shared.agent_registry import get_worker_entrypoints, get_registered_agents

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("worker_main")


async def run_worker_loop():
    logger.info("Initializing DelegtLabs Worker Main Engine...")
    worker_entrypoints = get_worker_entrypoints()
    registered_agents = get_registered_agents()

    logger.info(f"Discovered {len(registered_agents)} agents in registry:")
    for agent in registered_agents:
        slug = agent["slug"]
        schedule = agent.get("worker_schedule", "N/A")
        worker_path = worker_entrypoints.get(slug)
        logger.info(f" - Agent [{slug}]: schedule='{schedule}', worker_path='{worker_path}'")

    target_slug = os.getenv("AGENT_SLUG")
    if target_slug:
        logger.info(f"Filtering execution to target AGENT_SLUG: '{target_slug}'")
        if target_slug in worker_entrypoints:
            worker_entrypoints = {target_slug: worker_entrypoints[target_slug]}

    # Dev/runner loop executing worker tasks for discovered agents
    for slug, path in worker_entrypoints.items():
        try:
            logger.info(f"Executing worker cycle for agent: {slug}")
            spec = importlib.util.spec_from_file_location(f"worker_{slug}", path)
            if spec and spec.loader:
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                if hasattr(mod, "run_linkedin_agent_task"):
                    res = await mod.run_linkedin_agent_task()
                    logger.info(f"Result for {slug}: {res['run']['output_summary']}")
        except Exception as e:
            logger.error(f"Error executing worker for {slug}: {e}")

    logger.info("Worker execution cycle finished.")


if __name__ == "__main__":
    asyncio.run(run_worker_loop())
