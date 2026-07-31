from app.agent_registry import get_registered_agents, get_worker_entrypoints


def test_reference_agents_registered():
    agents = get_registered_agents()
    slugs = {a["slug"] for a in agents}
    assert {"linkedin-agent", "lawyer-agent"}.issubset(slugs)

    workers = get_worker_entrypoints()
    assert {"linkedin-agent", "lawyer-agent"}.issubset(set(workers.keys()))


def test_linkedin_manifest_has_pr_capability():
    agents = {a["slug"]: a for a in get_registered_agents()}
    li = agents["linkedin-agent"]
    assert "pr_posting" in li.get("capabilities", [])
    assert li.get("version", "").startswith("1")


def test_lawyer_manifest_legal_drafting():
    agents = {a["slug"]: a for a in get_registered_agents()}
    lawyer = agents["lawyer-agent"]
    assert lawyer["category"] == "legal"
    assert "legal_drafting" in lawyer.get("capabilities", [])
