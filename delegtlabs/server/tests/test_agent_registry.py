from shared.agent_registry import get_registered_agents, get_agent_manifest, get_worker_entrypoints
from shared.db.models import AgentConfig, AgentRun, AgentMetricDaily, AgentCredential


def test_agent_registry_empty_or_valid():
    agents = get_registered_agents()
    assert isinstance(agents, list)
    manifest = get_agent_manifest("non-existent-agent")
    assert manifest is None
    workers = get_worker_entrypoints()
    assert isinstance(workers, dict)


def test_shared_agent_models_instantiation():
    config = AgentConfig()
    assert config is not None
    run = AgentRun()
    assert run is not None
    metric = AgentMetricDaily()
    assert metric is not None
    cred = AgentCredential()
    assert cred is not None
