-- Migration: 017_subscription_quota
-- schema_migrations.version = filename stem: 017_subscription_quota
--   (inserted by migrate.py, not this file)
--
-- TS-16: plan quota ints, usage counters, posts/jobs tenant attribution,
-- post_gen plan_id backfill + CHECK. Catalog UPSERT is 013-style.
-- Does NOT DROP monthly_credits. Does NOT DELETE 013 plan rows.
-- Does NOT grant wallet credits or insert credit_transactions.
-- Does NOT stamp posts.tenant_id with DEFAULT_TENANT_ID.
-- Rollback: app/db/rollbacks/017_subscription_quota_rollback.sql

BEGIN;

-- =============================================
-- 1. subscription_plans quota columns
-- =============================================
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS daily_text INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_image INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_image INTEGER NOT NULL DEFAULT 0;

ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_daily_text_chk;
ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_daily_text_chk
  CHECK (daily_text >= 0);

ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_daily_image_chk;
ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_daily_image_chk
  CHECK (daily_image >= 0);

ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_weekly_image_chk;
ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_weekly_image_chk
  CHECK (weekly_image >= 0);

-- =============================================
-- 2. subscription_quota_usage
-- period_start has no DEFAULT (must be UTC date / Monday from the app).
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_quota_usage (
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_kind     agent_kind NOT NULL DEFAULT 'post_gen',
  quota_slot     TEXT NOT NULL,
  period_start   DATE NOT NULL,
  used           INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, agent_kind, quota_slot, period_start),
  CONSTRAINT subscription_quota_usage_used_chk CHECK (used >= 0),
  CONSTRAINT subscription_quota_usage_slot_chk CHECK (
    quota_slot IN ('daily_text', 'daily_image', 'weekly_image')
  ),
  CONSTRAINT subscription_quota_usage_week_monday_chk CHECK (
    quota_slot <> 'weekly_image'
    OR EXTRACT(ISODOW FROM period_start) = 1
  )
);

-- =============================================
-- 3. posts tenant attribution
-- =============================================
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS quota_slot TEXT NULL;

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_quota_slot_chk;
ALTER TABLE posts ADD CONSTRAINT posts_quota_slot_chk CHECK (
  quota_slot IS NULL
  OR quota_slot IN ('daily_text', 'daily_image', 'weekly_image')
);

-- =============================================
-- 4. jobs tenant attribution
-- =============================================
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS quota_slot TEXT NULL;

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_quota_slot_chk;
ALTER TABLE jobs ADD CONSTRAINT jobs_quota_slot_chk CHECK (
  quota_slot IS NULL
  OR quota_slot IN ('daily_text', 'daily_image', 'weekly_image')
);

-- =============================================
-- 5. Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_posts_tenant_id ON posts (tenant_id);

CREATE INDEX IF NOT EXISTS idx_posts_tenant_quota_created
  ON posts (tenant_id, created_at DESC)
  WHERE quota_slot IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_tenant_id ON jobs (tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_jobs_pending_generate_tenant
  ON jobs (tenant_id)
  WHERE type = 'generate'
    AND status IN ('pending', 'running')
    AND tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asub_post_gen_eligible
  ON agent_subscriptions (tenant_id)
  WHERE agent_kind = 'post_gen'
    AND status IN ('active', 'trialing');

-- =============================================
-- 6. RLS (ENABLE only — no FORCE)
-- =============================================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_quota_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS posts_select ON posts;
CREATE POLICY posts_select ON posts FOR SELECT USING (
  app_is_platform_staff()
  OR (tenant_id IS NOT NULL AND app_is_tenant_member(tenant_id))
);

DROP POLICY IF EXISTS posts_write ON posts;
CREATE POLICY posts_write ON posts FOR ALL USING (
  app_is_platform_staff()
  OR (
    app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
    AND tenant_id = app_current_tenant_id()
  )
) WITH CHECK (
  app_is_platform_staff()
  OR (
    app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
    AND tenant_id = app_current_tenant_id()
  )
);

DROP POLICY IF EXISTS jobs_select ON jobs;
CREATE POLICY jobs_select ON jobs FOR SELECT USING (
  app_is_platform_staff()
  OR (tenant_id IS NOT NULL AND app_is_tenant_member(tenant_id))
);

DROP POLICY IF EXISTS jobs_write ON jobs;
CREATE POLICY jobs_write ON jobs FOR ALL USING (
  app_is_platform_staff()
  OR (
    app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
    AND tenant_id = app_current_tenant_id()
  )
) WITH CHECK (
  app_is_platform_staff()
  OR (
    app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
    AND tenant_id = app_current_tenant_id()
  )
);

DROP POLICY IF EXISTS squota_select ON subscription_quota_usage;
CREATE POLICY squota_select ON subscription_quota_usage FOR SELECT USING (
  app_is_platform_staff() OR app_is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS squota_write ON subscription_quota_usage;
CREATE POLICY squota_write ON subscription_quota_usage FOR ALL USING (
  app_is_platform_staff() OR app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
) WITH CHECK (
  app_is_platform_staff() OR app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
);

-- =============================================
-- 7. 013-style UPSERT (after ALTER so quota columns exist)
-- DO UPDATE must not overwrite prices, tier, seats, linkedin_accounts,
-- rollover_months, badge, sort_order.
-- features stay [].
-- =============================================
INSERT INTO subscription_plans (
  code, name, description, agent_kind, tier,
  price_inr_minor, price_usd_minor,
  billing_period, monthly_credits, rollover_months, seats, linkedin_accounts,
  features, badge, is_active, is_default, sort_order,
  daily_text, daily_image, weekly_image
) VALUES
  ('free', 'Free',
   '1 high-quality image post per week. No expiry.',
   'post_gen', 'free',
   0, 0,
   'monthly', 0, 0, 1, 1,
   '[]'::jsonb, NULL, true, true, 10,
   0, 0, 1),

  ('starter', 'Starter',
   'For one person posting a few times a week.',
   'post_gen', 'starter',
   49900, 499,
   'monthly', 0, 1, 1, 1,
   '[]'::jsonb, NULL, true, false, 20,
   1, 0, 3),

  ('growth', 'Growth',
   'Daily posting with images, small team.',
   'post_gen', 'pro',
   149900, 1499,
   'monthly', 0, 2, 3, 3,
   '[]'::jsonb, 'Most popular', true, false, 30,
   3, 2, 0),

  ('scale', 'Scale',
   'Agencies and multi-brand publishing.',
   'post_gen', 'enterprise',
   399900, 3999,
   'monthly', 0, 3, 10, 10,
   '[]'::jsonb, NULL, true, false, 40,
   20, 10, 0)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_credits = EXCLUDED.monthly_credits,
  daily_text = EXCLUDED.daily_text,
  daily_image = EXCLUDED.daily_image,
  weekly_image = EXCLUDED.weekly_image,
  features = EXCLUDED.features,
  is_active = true,
  is_default = EXCLUDED.is_default,
  description = CASE
    WHEN subscription_plans.code = 'free' THEN EXCLUDED.description
    ELSE subscription_plans.description
  END,
  updated_at = NOW();

-- =============================================
-- 8. Best-effort posts.tenant_id backfill
-- linkedin_connections first, then topics. Never DEFAULT_TENANT_ID.
-- =============================================
UPDATE posts
SET tenant_id = lc.tenant_id
FROM linkedin_connections lc
WHERE posts.destination_id = lc.id
  AND posts.tenant_id IS NULL;

UPDATE posts
SET tenant_id = t.tenant_id
FROM topics t
WHERE posts.topic_id = t.id
  AND posts.tenant_id IS NULL
  AND t.tenant_id IS NOT NULL;

-- =============================================
-- 9. Backfill post_gen NULL plan_id from is_default plan
-- =============================================
UPDATE agent_subscriptions
SET plan_id = (
  SELECT id
  FROM subscription_plans
  WHERE agent_kind = 'post_gen'
    AND is_default = true
  LIMIT 1
)
WHERE agent_kind = 'post_gen'
  AND plan_id IS NULL;

-- =============================================
-- 10. post_gen requires plan_id (after backfill)
-- =============================================
ALTER TABLE agent_subscriptions DROP CONSTRAINT IF EXISTS asub_post_gen_plan_required_chk;
ALTER TABLE agent_subscriptions ADD CONSTRAINT asub_post_gen_plan_required_chk
  CHECK (agent_kind <> 'post_gen' OR plan_id IS NOT NULL);

COMMIT;
