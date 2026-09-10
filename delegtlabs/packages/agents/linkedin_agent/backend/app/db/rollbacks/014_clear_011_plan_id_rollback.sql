-- Rollback: 014_clear_011_plan_id
-- schema_migrations.version deleted: 014_clear_011_plan_id
--
-- Re-applies the 011 UPDATE (011:94-97): set plan_id to growth
-- where agent_kind = 'post_gen' AND plan_id IS NULL.
--
-- Forward 014 leaves current_period_start as-is (does not NULL it).
-- The COALESCE here therefore only fills rows that never had a
-- period start; existing timestamps from 011 are not overwritten.
--
-- Residual: any post_gen row that was already NULL (created after
-- 011, never assigned growth) would also receive growth on rollback,
-- same as re-running 011.
--
-- Local/test only unless a human explicitly approves another
-- environment (G10).

UPDATE agent_subscriptions
SET plan_id = (SELECT id FROM subscription_plans WHERE code = 'growth'),
    current_period_start = COALESCE(current_period_start, NOW())
WHERE agent_kind = 'post_gen' AND plan_id IS NULL;

DELETE FROM schema_migrations WHERE version = '014_clear_011_plan_id';
