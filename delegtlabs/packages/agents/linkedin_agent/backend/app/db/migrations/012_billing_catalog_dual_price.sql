-- Migration: 012_billing_catalog_dual_price
-- schema_migrations.version = filename stem: 012_billing_catalog_dual_price
--
-- Locked catalog money shape (C-BILLING-CATALOG / Q-4b):
--   price_inr_minor INTEGER (paise), price_usd_minor INTEGER (cents).
--   Drops 010's currency CHAR(3) + price_minor pair.
-- credit_action_costs stays credits-only.
--
-- Idempotent whether 010 ran or not:
--   1. CREATE IF NOT EXISTS in the locked shape (fresh DB / 010 absent).
--   2. ADD COLUMN IF NOT EXISTS dual prices (010 already created old shape).
--   3. Backfill from currency+price_minor when those columns still exist.
--   4. DROP currency / price_minor.
--   5. Remainder of 010: tenant FKs, indexes, RLS, triggers, drop 002 stubs.
--
-- Do NOT run 010_billing_catalog_rollback.sql after this version is applied
-- (it drops catalog tables and only deletes 010/011 version rows).

-- =============================================
-- 1. CREATE IF NOT EXISTS — locked shape
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  description       TEXT,
  agent_kind        agent_kind NOT NULL DEFAULT 'post_gen',
  tier              subscription_tier NOT NULL DEFAULT 'starter',
  price_inr_minor   INTEGER NOT NULL DEFAULT 0 CHECK (price_inr_minor >= 0),
  price_usd_minor   INTEGER NOT NULL DEFAULT 0 CHECK (price_usd_minor >= 0),
  billing_period    TEXT NOT NULL DEFAULT 'monthly'
                    CHECK (billing_period IN ('monthly', 'yearly')),
  monthly_credits   INTEGER NOT NULL DEFAULT 0 CHECK (monthly_credits >= 0),
  rollover_months   INTEGER NOT NULL DEFAULT 0 CHECK (rollover_months >= 0),
  seats             INTEGER NOT NULL DEFAULT 1 CHECK (seats >= 1),
  linkedin_accounts INTEGER NOT NULL DEFAULT 1 CHECK (linkedin_accounts >= 1),
  features          JSONB NOT NULL DEFAULT '[]',
  badge             TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  is_default        BOOLEAN NOT NULL DEFAULT false,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_packs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  price_inr_minor INTEGER NOT NULL DEFAULT 0 CHECK (price_inr_minor >= 0),
  price_usd_minor INTEGER NOT NULL DEFAULT 0 CHECK (price_usd_minor >= 0),
  credits         INTEGER NOT NULL CHECK (credits > 0),
  bonus_credits   INTEGER NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
  badge           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_action_costs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key  TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  description TEXT,
  agent_kind  agent_kind NOT NULL DEFAULT 'post_gen',
  credits     INTEGER NOT NULL DEFAULT 1 CHECK (credits >= 0),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 2. ADD dual-price columns when 010 created the old shape
-- =============================================
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS price_inr_minor INTEGER NOT NULL DEFAULT 0
    CHECK (price_inr_minor >= 0);
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS price_usd_minor INTEGER NOT NULL DEFAULT 0
    CHECK (price_usd_minor >= 0);

ALTER TABLE credit_packs
  ADD COLUMN IF NOT EXISTS price_inr_minor INTEGER NOT NULL DEFAULT 0
    CHECK (price_inr_minor >= 0);
ALTER TABLE credit_packs
  ADD COLUMN IF NOT EXISTS price_usd_minor INTEGER NOT NULL DEFAULT 0
    CHECK (price_usd_minor >= 0);

-- =============================================
-- 3. Backfill from 010 currency + price_minor (rate: USD = INR/100)
-- =============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_plans'
      AND column_name = 'price_minor'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_plans'
      AND column_name = 'currency'
  ) THEN
    UPDATE subscription_plans SET
      price_inr_minor = CASE
        WHEN currency = 'INR' THEN price_minor
        WHEN currency = 'USD' THEN price_minor * 100
        ELSE price_inr_minor
      END,
      price_usd_minor = CASE
        WHEN currency = 'INR' THEN price_minor / 100
        WHEN currency = 'USD' THEN price_minor
        ELSE price_usd_minor
      END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'credit_packs'
      AND column_name = 'price_minor'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'credit_packs'
      AND column_name = 'currency'
  ) THEN
    UPDATE credit_packs SET
      price_inr_minor = CASE
        WHEN currency = 'INR' THEN price_minor
        WHEN currency = 'USD' THEN price_minor * 100
        ELSE price_inr_minor
      END,
      price_usd_minor = CASE
        WHEN currency = 'INR' THEN price_minor / 100
        WHEN currency = 'USD' THEN price_minor
        ELSE price_usd_minor
      END;
  END IF;
END $$;

-- =============================================
-- 4. DROP 010 money columns
-- =============================================
ALTER TABLE subscription_plans DROP COLUMN IF EXISTS currency;
ALTER TABLE subscription_plans DROP COLUMN IF EXISTS price_minor;
ALTER TABLE credit_packs DROP COLUMN IF EXISTS currency;
ALTER TABLE credit_packs DROP COLUMN IF EXISTS price_minor;

-- =============================================
-- 5. Tenant-state links (010; no-op if 010 already added them)
-- =============================================
ALTER TABLE agent_subscriptions
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;
ALTER TABLE agent_subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;

ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS pack_id UUID REFERENCES credit_packs(id) ON DELETE SET NULL;
ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'adjustment'
  CHECK (kind IN ('purchase', 'usage', 'grant', 'adjustment'));
CREATE INDEX IF NOT EXISTS idx_credit_tx_kind
  ON credit_transactions(tenant_id, kind, created_at DESC);

-- =============================================
-- 6. Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_sub_plans_active
  ON subscription_plans(agent_kind, is_active, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sub_plans_default
  ON subscription_plans(agent_kind) WHERE is_default;
CREATE INDEX IF NOT EXISTS idx_credit_packs_active
  ON credit_packs(is_active, sort_order);

-- =============================================
-- 7. RLS + triggers (same as 010; no trigger on credit_action_costs)
-- =============================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_action_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sub_plans_select ON subscription_plans;
CREATE POLICY sub_plans_select ON subscription_plans FOR SELECT USING (true);
DROP POLICY IF EXISTS sub_plans_write ON subscription_plans;
CREATE POLICY sub_plans_write ON subscription_plans FOR ALL USING (
  app_is_platform_staff() AND app_staff_role() IN ('tech', 'finance')
) WITH CHECK (
  app_is_platform_staff() AND app_staff_role() IN ('tech', 'finance')
);

DROP POLICY IF EXISTS credit_packs_select ON credit_packs;
CREATE POLICY credit_packs_select ON credit_packs FOR SELECT USING (true);
DROP POLICY IF EXISTS credit_packs_write ON credit_packs;
CREATE POLICY credit_packs_write ON credit_packs FOR ALL USING (
  app_is_platform_staff() AND app_staff_role() IN ('tech', 'finance')
) WITH CHECK (
  app_is_platform_staff() AND app_staff_role() IN ('tech', 'finance')
);

DROP POLICY IF EXISTS action_costs_select ON credit_action_costs;
CREATE POLICY action_costs_select ON credit_action_costs FOR SELECT USING (true);
DROP POLICY IF EXISTS action_costs_write ON credit_action_costs;
CREATE POLICY action_costs_write ON credit_action_costs FOR ALL USING (
  app_is_platform_staff() AND app_staff_role() IN ('tech', 'finance')
) WITH CHECK (
  app_is_platform_staff() AND app_staff_role() IN ('tech', 'finance')
);

DO $$ BEGIN
  CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_credit_packs_updated_at
    BEFORE UPDATE ON credit_packs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================
-- 8. Retire unused 002 stubs (do not drop invoices)
-- =============================================
DROP TABLE IF EXISTS billing_plans;
DROP TABLE IF EXISTS credit_pack_pricing;
