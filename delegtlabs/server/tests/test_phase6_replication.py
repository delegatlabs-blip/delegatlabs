"""Phase 6 tests that all replicated agents are auto discovered by agent_registry.
"""

from shared.agent_registry import get_registered_agents, get_worker_entrypoints


def test_active_agents_auto_discovered():
    agents = get_registered_agents()
    slugs = {a["slug"] for a in agents}
    expected_slugs = {
        "linkedin-agent",
        "facebook-ads-agent",
        "instagram-agent",
        "email-agent",
        "seo-agent",
        "lawyer-agent",
    }
    assert expected_slugs.issubset(slugs)

    workers = get_worker_entrypoints()
    for slug in expected_slugs:
        assert slug in workers
