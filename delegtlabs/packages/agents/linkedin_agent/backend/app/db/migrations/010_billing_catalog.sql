-- Migration: 010_billing_catalog
-- Admin-managed billing catalog: subscription plans, credit packs, per-action
-- credit costs. Replaces the unused 002 Stripe stubs (billing_plans,
-- credit_pack_pricing) and the hard-coded MOCK_PLANS/MOCK_CREDIT_PACKS the
-- Post Gen tabs used to render.
--
-- Money is stored in the currency's minor unit (paise for INR) as an integer.
-- Never store money as float.

-- =============================================
-- SUBSCRIPTION PLANS (recurring)
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  description       TEXT,
  agent_kind        agent_kind NOT NULL DEFAULT 'post_gen',
  tier              subscription_tier NOT NULL DEFAULT 'starter',
  currency          CHAR(3) NOT NULL DEFAULT 'INR',
  price_minor       INTEGER NOT NULL DEFAULT 0 CHECK (price_minor >= 0),
  billing_period    TEXT NOT NULL DEFAULT 'monthly'
                    CHECK (billing_period IN ('monthly', 'yearly')),
  -- Credits granted at the start of every billing cycle.
  monthly_credits   INTEGER NOT NULL DEFAULT 0 CHECK (monthly_credits >= 0),
  -- How many cycles unused credits survive. 0 = use-it-or-lose-it.
  rollover_months   INTEGER NOT NULL DEFAULT 0 CHECK (rollover_months >= 0),
  seats             INTEGER NOT NULL DEFAULT 1 CHECK (seats >= 1),
  linkedin_accounts INTEGER NOT NULL DEFAULT 1 CHECK (linkedin_accounts >= 1),
  -- Bullet list rendered on the pricing card, e.g. ["Priority queue", "..."]
  features          JSONB NOT NULL DEFAULT '[]',
  badge             TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  is_default        BOOLEAN NOT NULL DEFAULT false,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sub_plans_active
  ON subscription_plans(agent_kind, is_active, sort_order);

-- At most one default plan per agent.
CREATE UNIQUE INDEX IF NOT EXISTS uq_sub_plans_default
  ON subscription_plans(agent_kind) WHERE is_default;

-- =============================================
-- CREDIT PACKS (one-time top-ups)
-- =============================================
CREATE TABLE IF NOT EXISTS credit_packs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  currency      CHAR(3) NOT NULL DEFAULT 'INR',
  price_minor   INTEGER NOT NULL DEFAULT 0 CHECK (price_minor >= 0),
  credits       INTEGER NOT NULL CHECK (credits > 0),
  -- Volume discount expressed as free credits rather than a lower unit price,
  -- so the headline "1 credit = Rs 1" anchor never moves.
  bonus_credits INTEGER NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
  badge         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credit_packs_active
  ON credit_packs(is_active, sort_order);

-- =============================================
-- PER-ACTION CREDIT COSTS
-- =============================================
-- The meter. One row per billable action; changing `credits` here re-prices the
-- whole product without touching a plan or a pack.
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
-- LINK TENANT STATE TO THE CATALOG
-- =============================================
ALTER TABLE agent_subscriptions
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;
ALTER TABLE agent_subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;

-- Ledger provenance: which pack a purchase came from, and what kind of movement
-- each row is, so the Credits tab can show purchases and usage separately.
ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS pack_id UUID REFERENCES credit_packs(id) ON DELETE SET NULL;
ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'adjustment'
  CHECK (kind IN ('purchase', 'usage', 'grant', 'adjustment'));
CREATE INDEX IF NOT EXISTS idx_credit_tx_kind
  ON credit_transactions(tenant_id, kind, created_at DESC);

-- =============================================
-- RLS: catalog is world-readable, staff-writable
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
-- RETIRE THE UNUSED 002 STUBS
-- =============================================
-- Neither table was ever read by application code (grep: only 002 creates them
-- and 003 seeds them). subscription_plans / credit_packs supersede both.
DROP TABLE IF EXISTS billing_plans;
DROP TABLE IF EXISTS credit_pack_pricing;
