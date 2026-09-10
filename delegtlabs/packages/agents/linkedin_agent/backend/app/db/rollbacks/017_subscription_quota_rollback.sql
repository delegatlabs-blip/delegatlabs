-- Rollback for: 017_subscription_quota
-- Apply with:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f app/db/rollbacks/017_subscription_quota_rollback.sql
--
-- Reverse of 017. Drops quota usage history and posts/jobs tenant_id
-- (attribution lost). Restores 013 catalog integers/name/free description.
-- Does NOT DELETE plan rows. Does NOT restore 011 feature bullets.
-- Does NOT un-stamp agent_subscriptions.plan_id (residual: post_gen may
-- still point at free). Local/test only unless a human approves that
-- data loss (G10).

BEGIN;

DROP POLICY IF EXISTS posts_write ON posts;
DROP POLICY IF EXISTS posts_select ON posts;
DROP POLICY IF EXISTS jobs_write ON jobs;
DROP POLICY IF EXISTS jobs_select ON jobs;
DROP POLICY IF EXISTS squota_write ON subscription_quota_usage;
DROP POLICY IF EXISTS squota_select ON subscription_quota_usage;

ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS subscription_quota_usage;

DROP INDEX IF EXISTS idx_posts_tenant_id;
DROP INDEX IF EXISTS idx_posts_tenant_quota_created;
DROP INDEX IF EXISTS idx_jobs_tenant_id;
DROP INDEX IF EXISTS uq_jobs_pending_generate_tenant;
DROP INDEX IF EXISTS idx_asub_post_gen_eligible;

ALTER TABLE agent_subscriptions DROP CONSTRAINT IF EXISTS asub_post_gen_plan_required_chk;

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_quota_slot_chk;
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_quota_slot_chk;
ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_weekly_image_chk;
ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_daily_image_chk;
ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_daily_text_chk;

ALTER TABLE posts
  DROP COLUMN IF EXISTS quota_slot,
  DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE jobs
  DROP COLUMN IF EXISTS quota_slot,
  DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE subscription_plans
  DROP COLUMN IF EXISTS weekly_image,
  DROP COLUMN IF EXISTS daily_image,
  DROP COLUMN IF EXISTS daily_text;

-- Restore 013 catalog (not 011). features left as [].
UPDATE subscription_plans SET
  name = 'Free trial',
  monthly_credits = 60,
  description = 'Try the agent before paying. 60 credits, once.',
  updated_at = NOW()
WHERE code = 'free';

UPDATE subscription_plans SET
  name = 'Starter',
  monthly_credits = 1000,
  updated_at = NOW()
WHERE code = 'starter';

UPDATE subscription_plans SET
  name = 'Growth',
  monthly_credits = 3000,
  updated_at = NOW()
WHERE code = 'growth';

UPDATE subscription_plans SET
  name = 'Scale',
  monthly_credits = 8000,
  updated_at = NOW()
WHERE code = 'scale';

DELETE FROM schema_migrations WHERE version = '017_subscription_quota';

COMMIT;
