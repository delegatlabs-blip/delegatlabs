-- Rollback: 010_billing_catalog (+ 011_billing_catalog_seed)
-- Restores the 002 Stripe stub tables and drops the admin-managed catalog.

ALTER TABLE agent_subscriptions DROP COLUMN IF EXISTS plan_id;
ALTER TABLE agent_subscriptions DROP COLUMN IF EXISTS current_period_start;

ALTER TABLE credit_transactions DROP COLUMN IF EXISTS pack_id;
ALTER TABLE credit_transactions DROP COLUMN IF EXISTS kind;
DROP INDEX IF EXISTS idx_credit_tx_kind;

DROP TABLE IF EXISTS credit_action_costs;
DROP TABLE IF EXISTS credit_packs;
DROP TABLE IF EXISTS subscription_plans;

CREATE TABLE IF NOT EXISTS billing_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_kind  agent_kind,
  name        TEXT NOT NULL,
  tier        subscription_tier NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  credit_pack INTEGER DEFAULT 0,
  stripe_price_id TEXT,
  is_active   BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS credit_pack_pricing (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credits     INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  is_active   BOOLEAN DEFAULT true
);

DELETE FROM schema_migrations WHERE version IN ('010_billing_catalog', '011_billing_catalog_seed');
