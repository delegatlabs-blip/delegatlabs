"""Publish-time compliance gate.

    Post text
       |
       v
    forbidden_phrases   -- literal substring match, free and instant
       |
       v
    semantic_rules      -- Gemini judgement, only when the tier requires it
       |
       v
    disclaimers         -- appended if missing
       |
    pass -> publish   |   fail -> approval_items (status pending)

`compliance_prompt_block` asks the model to behave; this module is what actually
stops a post. The two are independent on purpose — the prompt is advisory and a
model can ignore it.
"""
from __future__ import annotations

import json
import logging
import unicodedata
from typing import Any, Dict, List, Optional

from app.core.database import execute_one_raw
from app.services.audit import DEFAULT_TENANT_ID, write_audit_log
from app.services.gemini import judge_compliance

logger = logging.getLogger(__name__)

# LinkedIn's post limit is 3000 characters. Leave headroom so appending a
# disclaimer never silently truncates the post body.
LINKEDIN_SAFE_LENGTH = 2900

# Below this share of non-ASCII letters a post is treated as English. Substring
# matching cannot read other scripts, so anything above it forces the semantic
# check regardless of tier.
NON_ENGLISH_LETTER_RATIO = 0.20


class ComplianceBlocked(Exception):
    """Raised when a post fails the gate. Carries the findings for the caller."""

    def __init__(self, post_id: int, result: Dict[str, Any]):
        self.post_id = post_id
        self.result = result
        summary = "; ".join(v["detail"] for v in result.get("violations", [])[:3])
        super().__init__(f"Post {post_id} blocked by compliance: {summary or 'unspecified'}")


def looks_non_english(text: str) -> bool:
    """Heuristic script check. Counts letters only — emoji and punctuation are
    common in English LinkedIn posts and must not trip this."""
    letters = [c for c in text if unicodedata.category(c).startswith("L")]
    if len(letters) < 20:
        return False
    non_ascii = sum(1 for c in letters if ord(c) > 127)
    return (non_ascii / len(letters)) > NON_ENGLISH_LETTER_RATIO


def scan_forbidden_phrases(text: str, phrases: List[str]) -> List[Dict[str, str]]:
    """Case-insensitive substring match. Deliberately literal — this is the free
    fast path, not the clever one."""
    lowered = text.lower()
    hits = []
    for phrase in phrases:
        if phrase and phrase.lower() in lowered:
            hits.append({
                "type": "forbidden_phrase",
                "rule": phrase,
                "detail": f'contains forbidden phrase "{phrase}"',
            })
    return hits


def missing_disclaimers(text: str, disclaimers: List[str]) -> List[str]:
    lowered = text.lower()
    return [d for d in disclaimers if d and d.lower() not in lowered]


def _should_run_semantic(
    tier: int,
    requires_semantic: bool,
    fast_path_tripped: bool,
    non_english: bool,
) -> bool:
    if non_english:
        return True          # substring matching is blind here
    if requires_semantic:
        return True          # rule set opted in explicitly
    if tier <= 1:
        return True          # licensed professions: always
    if tier == 2:
        return fast_path_tripped
    return False             # tier 3: fast path only


async def run_compliance_check(
    text: str,
    effective_config: Dict[str, Any],
) -> Dict[str, Any]:
    """Run the gate over post text.

    Returns a result dict; never raises for a policy failure (the caller decides
    what to do with `passed`).
    """
    block = effective_config.get("_compliance") or {}
    phrases = block.get("forbidden_phrases") or []
    disclaimers = block.get("required_disclaimers") or []
    semantic_rules = block.get("semantic_rules") or []
    tier = int(block.get("risk_tier") or 3)
    requires_semantic = bool(block.get("requires_semantic_check"))

    violations: List[Dict[str, str]] = []

    # 1. Fast path
    phrase_hits = scan_forbidden_phrases(text, phrases)
    violations.extend(phrase_hits)

    # 2. Semantic path
    non_english = looks_non_english(text)
    semantic_ran = False
    semantic_error = None
    if _should_run_semantic(tier, requires_semantic, bool(phrase_hits), non_english):
        semantic_ran = True
        verdict = await judge_compliance(text, semantic_rules)
        semantic_error = verdict.get("error")
        for v in verdict.get("violations", []):
            violations.append({
                "type": "semantic_rule",
                "rule": v.get("rule", ""),
                "detail": v.get("reason", "") or "violates a semantic rule",
                "quote": v.get("quote", ""),
            })
        if semantic_error:
            # Fail closed for licensed professions — we cannot claim the post was
            # checked. Lower tiers proceed on the fast path result alone.
            if tier <= 1:
                violations.append({
                    "type": "check_unavailable",
                    "rule": "semantic check required for tier 1",
                    "detail": f"semantic check could not run ({semantic_error})",
                })
            else:
                logger.warning(
                    "[ComplianceGate] Semantic check unavailable at tier %s, "
                    "proceeding on fast path only: %s", tier, semantic_error
                )

    # 3. Disclaimers
    absent = missing_disclaimers(text, disclaimers)
    final_text = text
    appended: List[str] = []
    if absent:
        candidate = text + "\n\n" + "\n".join(absent)
        if len(candidate) <= LINKEDIN_SAFE_LENGTH:
            final_text = candidate
            appended = absent
        else:
            violations.append({
                "type": "disclaimer",
                "rule": "; ".join(absent),
                "detail": (
                    "required disclaimer is missing and the post is too long to "
                    f"append it ({len(candidate)} chars > {LINKEDIN_SAFE_LENGTH})"
                ),
            })

    return {
        "passed": not violations,
        "violations": violations,
        "text": final_text,
        "appended_disclaimers": appended,
        "risk_tier": tier,
        "semantic_ran": semantic_ran,
        "semantic_error": semantic_error,
        "non_english": non_english,
        "industry": block.get("industry"),
    }


async def record_block(
    post_id: int,
    result: Dict[str, Any],
    post_text: str,
    tenant_id: str = DEFAULT_TENANT_ID,
) -> Optional[str]:
    """Park a blocked post in the admin approvals queue and audit the decision."""
    titles = [v["detail"] for v in result.get("violations", [])]
    title = f"Compliance block: {titles[0]}" if titles else "Compliance block"

    row = await execute_one_raw(
        """
        INSERT INTO approval_items
          (tenant_id, agent_kind, item_type, ref_id, title, body, status, metadata)
        VALUES
          (:tenant_id, 'post_gen', 'post', :ref_id, :title, :body, 'pending', CAST(:metadata AS jsonb))
        RETURNING id
        """,
        {
            "tenant_id": tenant_id,
            "ref_id": str(post_id),
            "title": title[:500],
            "body": post_text,
            "metadata": json.dumps({
                "violations": result.get("violations", []),
                "risk_tier": result.get("risk_tier"),
                "semantic_ran": result.get("semantic_ran"),
                "semantic_error": result.get("semantic_error"),
                "non_english": result.get("non_english"),
                "industry": result.get("industry"),
            }),
        },
    )

    await write_audit_log(
        actor_id="compliance_gate",
        actor_type="system",
        action="compliance.block",
        resource_type="post",
        resource_id=str(post_id),
        tenant_id=tenant_id,
        metadata={
            "violations": result.get("violations", []),
            "risk_tier": result.get("risk_tier"),
        },
    )

    return str(row["id"]) if row else None
