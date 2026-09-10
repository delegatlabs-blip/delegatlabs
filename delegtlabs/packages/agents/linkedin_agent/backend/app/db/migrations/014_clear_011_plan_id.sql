-- Migration: 014_clear_011_plan_id
-- schema_migrations.version = filename stem: 014_clear_011_plan_id
--
-- G10-authorized data cleanup (TS-9 / TS-8 Decision Record Q3).
-- 011:94-97 assigned leftover post_gen subscriptions to plan code
-- 'growth' when plan_id IS NULL, and set current_period_start via
-- COALESCE(current_period_start, NOW()).
--
-- This migration NULLs those leftover plan_id values so tenant
-- entitlement stays display-only (Q-8 A). current_period_start is
-- left as-is (not NULLed).
--
-- Does NOT edit 011 / 012 / 013.
-- Does NOT drop columns.
-- Does NOT DELETE packs.
-- Local compose apply only unless a human names another env (G10).

UPDATE agent_subscriptions
SET plan_id = NULL
WHERE agent_kind = 'post_gen'
  AND plan_id = (SELECT id FROM subscription_plans WHERE code = 'growth');
