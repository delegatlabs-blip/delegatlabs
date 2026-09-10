-- Migration: 007_user_auth_tenancy
-- Real user identity + tenant-per-signup for the LinkedIn agent user side.
-- Apply after: 006_linkedin_multi_destination.sql
-- Rollback:    app/db/rollbacks/007_user_auth_tenancy_rollback.sql
--              (kept OUTSIDE migrations/ because migrate.py applies every *.sql there)
--
-- Context: before this migration the app had no user identity at all. Every session
-- was minted as admin_id="owner" (app/api/deps.py) and the active tenant came from an
-- unverified X-Tenant-Id header (app/api/auth_context.py). This adds the missing
-- identity layer so a signup provisions its own tenant.
--
-- PII classification (new columns):
--   users.email                     -> personal (contact identifier)
--   users.full_name                 -> personal
--   users.avatar_url                -> personal (may embed provider ids)
--   users.last_login_ip             -> personal (network identifier)
--   auth_identities.provider_subject-> personal (stable IdP subject, e.g. LinkedIn sub)
--   auth_identities.email           -> personal (email as asserted by the provider)
--   email_otps.email                -> personal
--   email_otps.code_hash            -> sensitive (peppered SHA-256 of a live credential)
--   email_otps.request_ip           -> personal
--   user_sessions.user_agent        -> personal (device fingerprinting surface)
--   user_sessions.ip                -> personal
--   oauth_states.intent             -> none (flow discriminator)
--
-- Note: tenant_members.user_id stays TEXT and now holds users.id::text. That keeps the
-- existing RLS helper app_current_user_id() (003_saas_rls_seed.sql:4, returns TEXT)
-- working unchanged rather than forcing a type migration across every policy.

-- =============================================
-- 1. ENUMS
-- =============================================
DO $$ BEGIN
  CREATE TYPE auth_provider AS ENUM ('email', 'linkedin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE otp_purpose AS ENUM ('signin', 'link_identity');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================
-- 2. users — one row per human, independent of login method
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL,
  full_name         TEXT,
  avatar_url        TEXT,
  status            user_status NOT NULL DEFAULT 'pending',
  email_verified_at TIMESTAMPTZ,
  last_login_at     TIMESTAMPTZ,
  last_login_ip     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive uniqueness without requiring the citext extension.
-- The service layer also normalises to lowercase before every write.
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (LOWER(email));

DO $$ BEGIN
  CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================
-- 3. auth_identities — many login methods per user
-- =============================================
-- This is what makes "sign up by email, connect LinkedIn later" and
-- "sign up with LinkedIn directly" resolve to the SAME user row.
CREATE TABLE IF NOT EXISTS auth_identities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         auth_provider NOT NULL,
  provider_subject TEXT NOT NULL,
  email            TEXT,
  email_verified   BOOLEAN NOT NULL DEFAULT false,
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_subject)
);
CREATE INDEX IF NOT EXISTS idx_auth_identities_user ON auth_identities(user_id);

-- A user may hold at most one identity per provider.
CREATE UNIQUE INDEX IF NOT EXISTS uq_auth_identities_user_provider
  ON auth_identities (user_id, provider);

DO $$ BEGIN
  CREATE TRIGGER update_auth_identities_updated_at
    BEFORE UPDATE ON auth_identities
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================
-- 4. email_otps — short-lived, hashed, single-use
-- =============================================
-- Codes are never stored in clear: code_hash is a peppered SHA-256 (app/services/otp.py).
CREATE TABLE IF NOT EXISTS email_otps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  code_hash    TEXT NOT NULL,
  purpose      otp_purpose NOT NULL DEFAULT 'signin',
  attempts     INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ,
  request_ip   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_otps_lookup
  ON email_otps (LOWER(email), purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_otps_expiry ON email_otps (expires_at);

-- =============================================
-- 5. user_sessions — server-side handle so logout can actually revoke
-- =============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_agent  TEXT,
  ip          TEXT,
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active
  ON user_sessions (id) WHERE revoked_at IS NULL;

-- =============================================
-- 6. tenants — record who provisioned the workspace
-- =============================================
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- =============================================
-- 7. oauth_states — distinguish "sign me in" from "connect to my workspace"
-- =============================================
-- The LinkedIn authorize flow now serves two intents. A 'connect' state is bound to an
-- existing tenant (added in 006). A 'login' state has no tenant yet -- the tenant is
-- provisioned only after LinkedIn confirms who the person is.
ALTER TABLE oauth_states
  ADD COLUMN IF NOT EXISTS intent TEXT NOT NULL DEFAULT 'connect';

ALTER TABLE oauth_states
  DROP CONSTRAINT IF EXISTS oauth_states_intent_check;
ALTER TABLE oauth_states
  ADD CONSTRAINT oauth_states_intent_check CHECK (intent IN ('connect', 'login'));

-- A connect state must name its tenant; a login state must not have one yet.
ALTER TABLE oauth_states
  DROP CONSTRAINT IF EXISTS oauth_states_tenant_intent_check;
ALTER TABLE oauth_states
  ADD CONSTRAINT oauth_states_tenant_intent_check CHECK (
    (intent = 'connect' AND tenant_id IS NOT NULL)
    OR (intent = 'login' AND tenant_id IS NULL)
  );

-- =============================================
-- 8. RLS for the new tables
-- =============================================
-- Consistent with 003_saas_rls_seed.sql. NOTE: these policies are defence-in-depth only
-- until the app routes queries through rls_session() (app/services/audit.py:64), which
-- currently has no callers -- see README_AUTH.md "Known gaps".
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_self_select ON users;
CREATE POLICY users_self_select ON users FOR SELECT USING (
  app_is_platform_staff() OR id::text = app_current_user_id()
);
DROP POLICY IF EXISTS users_self_update ON users;
CREATE POLICY users_self_update ON users FOR UPDATE USING (
  app_is_platform_staff() OR id::text = app_current_user_id()
) WITH CHECK (
  app_is_platform_staff() OR id::text = app_current_user_id()
);

DROP POLICY IF EXISTS auth_identities_self ON auth_identities;
CREATE POLICY auth_identities_self ON auth_identities FOR ALL USING (
  app_is_platform_staff() OR user_id::text = app_current_user_id()
) WITH CHECK (
  app_is_platform_staff() OR user_id::text = app_current_user_id()
);

DROP POLICY IF EXISTS user_sessions_self ON user_sessions;
CREATE POLICY user_sessions_self ON user_sessions FOR ALL USING (
  app_is_platform_staff() OR user_id::text = app_current_user_id()
) WITH CHECK (
  app_is_platform_staff() OR user_id::text = app_current_user_id()
);

-- email_otps is deliberately NOT under RLS: rows are written and read before any
-- session exists, so there is no app.user_id to police them with. It is reachable
-- only through app/services/otp.py, which always filters by email + purpose.

-- =============================================
-- 9. Seed: keep the existing Default Workspace reachable after the cutover
-- =============================================
-- Before this migration all local data lived on tenant 00000000-...-0001 with the
-- synthetic member user_id 'owner'. Bind a real user to it so that data is still
-- reachable once the tenant comes from the session instead of a header.
INSERT INTO users (id, email, full_name, status, email_verified_at)
VALUES (
  '00000000-0000-0000-0000-0000000000a1',
  'dev@local.test',
  'Local Dev User',
  'active',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_identities (user_id, provider, provider_subject, email, email_verified)
VALUES (
  '00000000-0000-0000-0000-0000000000a1',
  'email',
  'dev@local.test',
  'dev@local.test',
  true
)
ON CONFLICT (provider, provider_subject) DO NOTHING;

INSERT INTO tenant_members (tenant_id, user_id, email, display_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000a1',
  'dev@local.test',
  'Local Dev User',
  'owner'
)
ON CONFLICT (tenant_id, user_id) DO NOTHING;

UPDATE tenants
SET created_by_user_id = '00000000-0000-0000-0000-0000000000a1'
WHERE id = '00000000-0000-0000-0000-000000000001'
  AND created_by_user_id IS NULL;
