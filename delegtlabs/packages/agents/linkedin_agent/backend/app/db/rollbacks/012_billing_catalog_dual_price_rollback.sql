-- Rollback: 012_billing_catalog_dual_price
-- schema_migrations.version deleted: 012_billing_catalog_dual_price
--
-- Run AFTER 013_billing_catalog_seed_locked_rollback.sql.
-- Do NOT run 010_billing_catalog_rollback.sql after 012/013 have been applied:
-- that file drops catalog tables and only deletes versions 010/011, leaving
-- 012/013 recorded against missing objects.
--
-- Local/test only unless a human explicitly approves another environment (G10).
-- Residual: independently edited USD is discarded (lossy). currency is reset
-- to 'INR' (USER display currency + 010 default).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM schema_migrations WHERE version = '010_billing_catalog'
  ) THEN
    -- 010 created the tables: reverse the ALTER only. Do not drop tables.
    ALTER TABLE subscription_plans
      ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'INR';
    ALTER TABLE subscription_plans
      ADD COLUMN IF NOT EXISTS price_minor INTEGER NOT NULL DEFAULT 0
        CHECK (price_minor >= 0);
    UPDATE subscription_plans
      SET price_minor = price_inr_minor, currency = 'INR';
    ALTER TABLE subscription_plans DROP COLUMN IF EXISTS price_inr_minor;
    ALTER TABLE subscription_plans DROP COLUMN IF EXISTS price_usd_minor;

    ALTER TABLE credit_packs
      ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'INR';
    ALTER TABLE credit_packs
      ADD COLUMN IF NOT EXISTS price_minor INTEGER NOT NULL DEFAULT 0
        CHECK (price_minor >= 0);
    UPDATE credit_packs
      SET price_minor = price_inr_minor, currency = 'INR';
    ALTER TABLE credit_packs DROP COLUMN IF EXISTS price_inr_minor;
    ALTER TABLE credit_packs DROP COLUMN IF EXISTS price_usd_minor;
  ELSE
    -- 012 was the sole creator: same destructive shape as 010 rollback.
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
  END IF;
END $$;

DELETE FROM schema_migrations WHERE version = '012_billing_catalog_dual_price';
