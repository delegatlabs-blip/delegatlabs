import importlib.util
import pytest
from app.agent_registry import get_worker_entrypoints


@pytest.mark.asyncio
async def test_linkedin_worker_execution_and_rollups():
    # 1. Verify worker entrypoints discovery
    workers = get_worker_entrypoints()
    assert "linkedin-agent" in workers

    worker_path = workers["linkedin-agent"]
    spec = importlib.util.spec_from_file_location("worker_linkedin", worker_path)
    assert spec is not None and spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    # 2. Trigger worker task manually
    res = await mod.run_linkedin_agent_task(client_agent_id="test-client-agent-id")
    assert res is not None
    assert "run" in res
    assert "daily_metric" in res

    run = res["run"]
    metric = res["daily_metric"]

    # 3. Verify run output
    assert run["status"] == "success"
    assert run["output_summary"]["leads_generated"] > 0
    assert metric["metric_name"] == "leads_generated"
