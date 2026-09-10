"""TS-8 seed integers. C-BILLING-CATALOG §5 + AC-SEED-* + TS-16 AMEND (AC-T8-01, AC-ED-07).

Filename 017 is locked by C-subscription-quota-schema. 013 historical grant integers
must not be treated as the live catalog.
"""
from __future__ import annotations

import re

from tests.ts8_helpers import (
    FREE_DESCRIPTION,
    MIGRATION_017,
    MIGRATION_019,
    OLD_011_PACK_CODES,
    OLD_MONTHLY_CREDITS,
    QUOTA_KEYS,
    ROLLBACK_017,
    ROLLBACK_019,
    SEED_COSTS,
    SEED_PACK,
    SEED_PACKS,
    SEED_PLANS,
    load_migration_sql,
)


def _require_017() -> str:
    assert MIGRATION_017.is_file(), (
        "017_subscription_quota.sql missing (C-subscription-quota-schema Wave 3 SQL)"
    )
    return MIGRATION_017.read_text()


def _plan_window(sql: str, code: str) -> str:
    patterns = (f"'{code}'", f'"{code}"', f"'{code}',", f"code) VALUES")
    idx = -1
    for pat in (f"'{code}'", f'"{code}"'):
        idx = sql.find(pat)
        if idx >= 0:
            break
    assert idx >= 0, f"plan code {code} missing from 017 SQL"
    return sql[max(0, idx - 250) : idx + 900]


def test_ac_seed_05_pack_vs_meter_arithmetic():
    """AC-SEED-05 / TS-22 Q-9: 200/50=4, 200/10=20; image_post credits=30 (200/30 is not int)."""
    credits = SEED_PACK["credits"]
    by_key = {row["action_key"]: row["credits"] for row in SEED_COSTS}
    assert credits / by_key["manual_post"] == 4
    assert credits / by_key["text_post"] == 20
    assert by_key["text_post"] == 10
    assert by_key["image_post"] == 30


def test_ac_seed_01_pack_minor_units_and_credits_in_sql():
    """AC-SEED-01: taster_100 / Taster / 200 credits / ₹100=10000 paise / $1=100 cents."""
    sql = load_migration_sql()
    assert "taster_100" in sql
    assert re.search(r"\bTaster\b", sql)
    assert "10000" in sql
    assert re.search(r"\b200\b", sql)
    idx = sql.find("taster_100")
    window = sql[max(0, idx - 400) : idx + 800]
    assert "10000" in window
    assert re.search(r"\b100\b", window)
    assert re.search(r"\b200\b", window)


def test_ac_seed_02_action_costs_in_sql():
    """AC-SEED-02 / TS-22 Q-9: keys exist in SQL; live helper lock is 50/10/30.

    013 historical 1/10 remains on disk (append-only). Live amounts are asserted
    against SEED_COSTS and migration 018+ (test_ts22_static AC-MIG-01).
    """
    sql = load_migration_sql()
    for row in SEED_COSTS:
        assert row["action_key"] in sql
    by_key = {row["action_key"]: row["credits"] for row in SEED_COSTS}
    assert by_key["manual_post"] == 50
    assert by_key["text_post"] == 10
    assert by_key["image_post"] == 30


def test_ac_seed_03_starter_growth_scale_and_free_quota_in_017():
    """AC-SEED-03 / AC-T8-01 / AC-ED-07: live lock is Free + monthly_credits 0 + quota ints in 017."""
    sql = _require_017()
    assert "Free trial" not in sql
    for plan in SEED_PLANS:
        assert plan["code"] in sql
        assert plan["name"] in sql
        window = _plan_window(sql, plan["code"])
        assert str(plan["price_inr_minor"]) in window or str(plan["price_inr_minor"]) in sql
        assert str(plan["price_usd_minor"]) in window or str(plan["price_usd_minor"]) in sql
        for key in QUOTA_KEYS:
            assert str(plan[key]) in window or str(plan[key]) in sql
        assert plan["monthly_credits"] == 0
    for old in OLD_MONTHLY_CREDITS:
        assert old not in {p["monthly_credits"] for p in SEED_PLANS}


def test_ac_t8_01_seed_plans_helper_is_quota_not_credit_grants():
    """AC-T8-01: SEED_PLANS must not freeze 60/1000/3000/8000 or Free trial."""
    by_code = {p["code"]: p for p in SEED_PLANS}
    assert by_code["free"]["name"] == "Free"
    assert by_code["free"]["description"] == FREE_DESCRIPTION
    for plan in SEED_PLANS:
        assert plan["monthly_credits"] == 0
        assert plan["monthly_credits"] not in OLD_MONTHLY_CREDITS
        assert "trial" not in plan["name"].lower()
        for key in QUOTA_KEYS:
            assert key in plan
            assert isinstance(plan[key], int)
            assert f"{key}_posts" not in plan
    assert by_code["starter"]["daily_text"] == 1
    assert by_code["starter"]["weekly_image"] == 3
    assert by_code["growth"]["daily_text"] == 3
    assert by_code["growth"]["daily_image"] == 2
    assert by_code["scale"]["daily_text"] == 20
    assert by_code["scale"]["daily_image"] == 10
    assert by_code["scale"]["daily_text"] + by_code["scale"]["daily_image"] == 30
    assert by_code["scale"]["daily_text"] + by_code["scale"]["daily_image"] != 24


def test_ac_seed_04_old_011_packs_not_required_active():
    """AC-SEED-04 / Wave-3: 011 extras are not required; if present they are deactivated."""
    sql = load_migration_sql()
    assert "taster_100" in sql
    for code in OLD_011_PACK_CODES:
        if code not in sql:
            continue
        assert re.search(
            rf"{code}[\s\S]{{0,400}}is_active\s*=\s*false|is_active\s*=\s*false[\s\S]{{0,400}}{code}",
            sql,
            flags=re.IGNORECASE,
        ), f"{code} present but not deactivated"


def test_ac_ed_07_free_description_locked_in_017():
    """AC-ED-07 / Q-FREE-DESC A: free description is the locked sentence."""
    sql = _require_017()
    assert FREE_DESCRIPTION in sql
    assert "60 credits, once" not in sql


def test_ac_t8_05_017_has_rollback():
    """AC-T8-05 / G10: 017 forward migration has a rollback file."""
    assert MIGRATION_017.is_file()
    assert ROLLBACK_017.is_file(), "017_subscription_quota_rollback.sql missing"
    rb = ROLLBACK_017.read_text()
    assert rb.strip(), "rollback file is empty"
    assert "daily_text" in rb or "subscription_quota_usage" in rb or "quota_slot" in rb


def _pack_window(sql: str, code: str) -> str:
    idx = sql.find(f"'{code}'")
    if idx < 0:
        idx = sql.find(f'"{code}"')
    assert idx >= 0, f"pack code {code} missing from SQL"
    return sql[max(0, idx - 80) : idx + 220]


def test_ac_seed_06_volume_packs_in_019():
    """019 adds Starter pack ₹200/500 and Growth pack ₹500/1500; keeps Taster."""
    assert MIGRATION_019.is_file(), "019_credit_packs_topup.sql missing"
    sql = MIGRATION_019.read_text()
    assert "taster_100" in sql
    for pack in SEED_PACKS:
        if pack["code"] == "taster_100":
            continue
        assert pack["code"] in sql
        assert pack["name"] in sql
        window = _pack_window(sql, pack["code"])
        assert str(pack["price_inr_minor"]) in window
        assert str(pack["price_usd_minor"]) in window
        assert str(pack["credits"]) in window
        assert str(pack["sort_order"]) in window


def test_ac_seed_07_019_has_rollback():
    """G10: 019 forward migration has a rollback that removes the volume packs."""
    assert MIGRATION_019.is_file()
    assert ROLLBACK_019.is_file(), "019_credit_packs_topup_rollback.sql missing"
    rb = ROLLBACK_019.read_text()
    assert rb.strip(), "rollback file is empty"
    assert "starter_pack_200" in rb
    assert "growth_pack_500" in rb
    assert "taster_100" in rb
    assert "DELETE FROM credit_packs" in rb or "delete from credit_packs" in rb.lower()
