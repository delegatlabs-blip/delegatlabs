-- Migration: 002_saas_platform
-- Multi-tenant SaaS tables + RLS for LinkedIn agent platform

-- =============================================
-- ENUMS
-- =============================================
DO $$ BEGIN
  CREATE TYPE tenant_account_type AS ENUM ('individual', 'organization');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE tenant_member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE staff_role AS ENUM ('support', 'finance', 'tech');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE agent_kind AS ENUM ('post_gen', 'lead_gen', 'analytics');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'trialing');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE approval_item_type AS ENUM ('post', 'outreach_draft');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE linkedin_surface AS ENUM ('personal', 'company');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE connection_health AS ENUM ('green', 'yellow', 'red', 'pending');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================
-- CORE TENANCY
-- =============================================
CREATE TABLE IF NOT EXISTS tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  account_type    tenant_account_type NOT NULL DEFAULT 'individual',
  industry        TEXT,
  subscription_status subscription_status NOT NULL DEFAULT 'trialing',
  credits_remaining INTEGER NOT NULL DEFAULT 100 CHECK (credits_remaining >= 0),
  brand_css       JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  email       TEXT,
  display_name TEXT,
  role        tenant_member_role NOT NULL DEFAULT 'viewer',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);

CREATE TABLE IF NOT EXISTS platform_staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL UNIQUE,
  email       TEXT NOT NULL,
  display_name TEXT,
  role        staff_role NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AGENTS / SUBSCRIPTIONS / CONFIG VERSIONS
-- =============================================
CREATE TABLE IF NOT EXISTS agent_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_kind  agent_kind NOT NULL,
  tier        subscription_tier NOT NULL DEFAULT 'free',
  status      subscription_status NOT NULL DEFAULT 'trialing',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, agent_kind)
);

CREATE TABLE IF NOT EXISTS agent_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_kind  agent_kind NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  config      JSONB NOT NULL DEFAULT '{}',
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, agent_kind, version)
);
CREATE INDEX IF NOT EXISTS idx_agent_configs_lookup ON agent_configs(tenant_id, agent_kind, version DESC);

-- =============================================
-- CREDITS
-- =============================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  agent_kind  agent_kind,
  admin_id    TEXT,
  balance_after INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credit_tx_tenant ON credit_transactions(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS credit_usage_daily (
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_kind  agent_kind NOT NULL,
  usage_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  credits_used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, agent_kind, usage_date)
);

-- =============================================
-- ONBOARDING (per-answer, resumable)
-- =============================================
CREATE TABLE IF NOT EXISTS onboarding_answers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question_id   TEXT NOT NULL,
  value         JSONB NOT NULL,
  answered_by   TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, question_id)
);

-- =============================================
-- COMPLIANCE (global, non-overridable)
-- =============================================
CREATE TABLE IF NOT EXISTS compliance_rule_sets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry    TEXT NOT NULL,
  name        TEXT NOT NULL,
  forbidden_phrases TEXT[] NOT NULL DEFAULT '{}',
  required_disclaimers TEXT[] NOT NULL DEFAULT '{}',
  extra_rules JSONB DEFAULT '{}',
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (industry, name)
);

-- =============================================
-- APPROVALS (cross-tenant queue)
-- =============================================
CREATE TABLE IF NOT EXISTS approval_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_kind  agent_kind NOT NULL,
  item_type   approval_item_type NOT NULL,
  ref_id      TEXT,
  title       TEXT,
  body        TEXT NOT NULL,
  status      approval_status NOT NULL DEFAULT 'pending',
  decision_reason TEXT,
  decided_by  TEXT,
  decided_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approvals_pending ON approval_items(status, created_at DESC);

-- =============================================
-- LINKEDIN CONNECTIONS + INTEGRATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS linkedin_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  surface         linkedin_surface NOT NULL,
  display_name    TEXT,
  token_expires_at TIMESTAMPTZ,
  health          connection_health NOT NULL DEFAULT 'red',
  metadata        JSONB DEFAULT '{}',
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, surface)
);

CREATE TABLE IF NOT EXISTS integrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'disconnected',
  config      JSONB DEFAULT '{}',
  last_tested_at TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, provider)
);

-- =============================================
-- LEAD GEN SAFE LIMITS
-- =============================================
CREATE TABLE IF NOT EXISTS outreach_counters (
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  counter_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  count       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, counter_type, period_start)
);

-- =============================================
-- BILLING (Stripe stubs)
-- =============================================
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

CREATE TABLE IF NOT EXISTS invoices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  amount_cents INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open',
  pdf_url     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_pack_pricing (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credits     INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  is_active   BOOLEAN DEFAULT true
);

-- =============================================
-- AUDIT LOG (append-only)
-- =============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    TEXT NOT NULL,
  actor_type  TEXT NOT NULL DEFAULT 'staff',
  action      TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE SET NULL,
  before_state JSONB,
  after_state JSONB,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);

-- Prevent UPDATE/DELETE on audit_log via revoke (app also never updates)
REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC;
