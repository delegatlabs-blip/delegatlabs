"""Merge global compliance rules into agent configs (non-removable)."""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, List, Optional

from app.core.database import execute_raw

# Sentinel industry whose rule set is unioned into every lookup. Must match the
# value seeded by 005_compliance_gate.sql.
GLOBAL_INDUSTRY = "global"


async def load_compliance_for_industry(industry: Optional[str]) -> List[Dict[str, Any]]:
    if not industry:
        rows = await execute_raw(
            """
            SELECT * FROM compliance_rule_sets
            WHERE is_active = true AND status = 'active'
            ORDER BY industry, name
            """
        )
        return rows
    rows = await execute_raw(
        """
        SELECT * FROM compliance_rule_sets
        WHERE is_active = true AND status = 'active'
          AND (LOWER(industry) = LOWER(:ind) OR industry = :global_ind)
        ORDER BY risk_tier, name
        """,
        {"ind": industry, "global_ind": GLOBAL_INDUSTRY},
    )
    return rows


async def industry_has_pending_review(industry: Optional[str]) -> bool:
    """True when a rule set for this industry exists but is awaiting admin sign-off.

    Publishing is held for these tenants — the rules were drafted but nobody has
    approved them, so we cannot claim the post was checked against anything.
    """
    if not industry:
        return False
    rows = await execute_raw(
        """
        SELECT 1 FROM compliance_rule_sets
        WHERE is_active = true AND status = 'pending_review'
          AND LOWER(industry) = LOWER(:ind)
        LIMIT 1
        """,
        {"ind": industry},
    )
    return bool(rows)


def _dedupe(values: List[str]) -> List[str]:
    seen, out = set(), []
    for v in values:
        if v and v not in seen:
            seen.add(v)
            out.append(v)
    return out


def merge_compliance_into_config(
    agent_config: Dict[str, Any],
    compliance_rules: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Produce effective runtime config.
    Compliance constraints are nested under `_compliance` and cannot be stripped
    by tenant-level config — callers must use this merge result, not raw config.

    Rules are flattened into phrase/disclaimer/semantic lists for the prompt and
    the fast path. Per-rule provenance is kept under `rule_sets` so the gate can
    report which set a violation came from, and the strictest tier wins.
    """
    effective = deepcopy(agent_config or {})
    phrases: List[str] = []
    disclaimers: List[str] = []
    semantic: List[str] = []
    rule_sets: List[Dict[str, Any]] = []

    # Escalation is a property of the INDUSTRY, not of the baseline. The global
    # rule set is merged into every lookup, so letting it vote on risk_tier would
    # pin every industry to whatever tier the baseline carries and force a
    # semantic call on every post — defeating the fast path. Its phrases and
    # semantic rules still apply; only its tier is ignored.
    industry_tiers: List[int] = []
    requires_semantic = False

    for rule in compliance_rules:
        rule_phrases = list(rule.get("forbidden_phrases") or [])
        rule_disc = list(rule.get("required_disclaimers") or [])
        rule_semantic = list(rule.get("semantic_rules") or [])

        phrases.extend(rule_phrases)
        disclaimers.extend(rule_disc)
        semantic.extend(rule_semantic)

        tier = rule.get("risk_tier")
        tier = int(tier) if tier is not None else 2
        is_global = (rule.get("industry") or "").lower() == GLOBAL_INDUSTRY
        if not is_global:
            industry_tiers.append(tier)
            if rule.get("requires_semantic_check"):
                requires_semantic = True

        rule_sets.append({
            "id": str(rule.get("id")) if rule.get("id") is not None else None,
            "industry": rule.get("industry"),
            "name": rule.get("name"),
            "risk_tier": tier,
            "forbidden_phrases": rule_phrases,
            "semantic_rules": rule_semantic,
        })

    # Tenant cannot override: always overwrite _compliance from global rules
    effective["_compliance"] = {
        "forbidden_phrases": _dedupe(phrases),
        "required_disclaimers": _dedupe(disclaimers),
        "semantic_rules": _dedupe(semantic),
        # No industry rule set matched (unknown industry): fall back to the column
        # default rather than the laxest tier, so the fast path still escalates.
        "risk_tier": min(industry_tiers) if industry_tiers else 2,
        "requires_semantic_check": requires_semantic,
        "rule_sets": rule_sets,
        "removable": False,
        "source": "global_compliance_rule_sets",
    }
    return effective


def compliance_prompt_block(effective_config: Dict[str, Any]) -> str:
    block = effective_config.get("_compliance") or {}
    phrases = block.get("forbidden_phrases") or []
    disclaimers = block.get("required_disclaimers") or []
    semantic = block.get("semantic_rules") or []
    if not phrases and not disclaimers and not semantic:
        return ""
    lines = ["## Compliance Constraints (MANDATORY — non-negotiable)"]
    if phrases:
        lines.append("Never use these forbidden phrases: " + "; ".join(f'"{p}"' for p in phrases))
    if semantic:
        lines.append("You must also satisfy every one of these rules:")
        lines.extend(f"- {r}" for r in semantic)
    if disclaimers:
        lines.append("Always include these disclaimers when relevant: " + " | ".join(disclaimers))
    lines.append(
        "A post violating any constraint above is rejected before publication. "
        "If you cannot satisfy a constraint, omit the claim entirely rather than hedging it."
    )
    return "\n".join(lines) + "\n"


async def get_effective_agent_config(
    tenant_id: str,
    agent_kind: str,
    industry: Optional[str] = None,
) -> Dict[str, Any]:
    from app.core.database import execute_one_raw

    row = await execute_one_raw(
        """
        SELECT config FROM agent_configs
        WHERE tenant_id = :tid AND agent_kind = :kind
        ORDER BY version DESC LIMIT 1
        """,
        {"tid": tenant_id, "kind": agent_kind},
    )
    raw = (row or {}).get("config") or {}
    if isinstance(raw, str):
        import json
        raw = json.loads(raw)

    if not industry:
        tenant = await execute_one_raw("SELECT industry FROM tenants WHERE id = :id", {"id": tenant_id})
        industry = (tenant or {}).get("industry")

    rules = await load_compliance_for_industry(industry)
    effective = merge_compliance_into_config(raw, rules)
    effective["_compliance"]["industry"] = industry
    return effective
