-- Migration: 019_credit_packs_topup
-- schema_migrations.version = filename stem: 019_credit_packs_topup
--   (inserted by migrate.py, not this file)
--
-- Adds volume credit packs alongside 013 taster_100.
-- Does NOT rewrite 013. Does NOT DELETE 011 leftover rows.
-- Does NOT grant wallet credits or insert credit_transactions.
-- Rollback: app/db/rollbacks/019_credit_packs_topup_rollback.sql

BEGIN;

UPDATE credit_packs
SET sort_order = 10, updated_at = NOW()
WHERE code = 'taster_100';

INSERT INTO credit_packs (
  code, name, price_inr_minor, price_usd_minor, credits, bonus_credits,
  is_active, sort_order
) VALUES
  ('starter_pack_200', 'Starter pack', 20000, 200, 500, 0, true, 20),
  ('growth_pack_500', 'Growth pack', 50000, 500, 1500, 0, true, 30)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  price_inr_minor = EXCLUDED.price_inr_minor,
  price_usd_minor = EXCLUDED.price_usd_minor,
  credits = EXCLUDED.credits,
  bonus_credits = EXCLUDED.bonus_credits,
  is_active = true,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

COMMIT;
