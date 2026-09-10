-- Migration: 008_linkedin_account_tenant_scope
-- Scope the LinkedIn account uniqueness to the tenant that owns it.
-- Apply after: 007_user_auth_tenancy.sql
-- Rollback:    app/db/rollbacks/008_linkedin_account_tenant_scope_rollback.sql
--              (kept OUTSIDE migrations/ because migrate.py applies every *.sql there)
--
-- Context: linkedin_accounts predates multi-tenancy. 006 added tenant_id and every
-- read/write in app/services/linkedin.py has keyed off it since -- _upsert_tenant_account
-- looks the row up BY TENANT -- but the UNIQUE constraint was never widened to match. It
-- stayed UNIQUE (member_urn), i.e. globally one row per LinkedIn member across the whole
-- platform, which contradicts the per-tenant upsert the code performs.
--
-- The mismatch stayed invisible while every OAuth round trip landed on one seeded tenant.
-- Once sign-in began provisioning a workspace per signup, the second workspace to reach
-- persist_connection() for an already-stored member hit:
--
--   IntegrityError: duplicate key value violates unique constraint
--                   "linkedin_accounts_member_urn_key"
--
-- which the callback swallowed into ?auth_error=, bouncing the user back to /signin.
--
-- No PII classification changes: this migration alters an index and removes rows; it adds
-- no columns.

BEGIN;

-- 1. One-time cleanup of connections stranded on the seeded Default Workspace.
--
-- Before the OAuth-intent fix, a signed-out "Sign in with LinkedIn" was misrouted down the
-- connect branch and bound the member to DEFAULT_TENANT_ID instead of provisioning a
-- workspace. Those rows are artefacts of that bug, and each one holds a LIVE encrypted
-- access token -- leaving them would let the seeded demo workspace publish as a real
-- person. Restricted to the fixed seed UUID from 003_saas_rls_seed.sql so it cannot touch
-- a genuine customer workspace.
DELETE FROM linkedin_accounts
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- 2. Widen the constraint to match how the code actually keys these rows.
-- Safe against existing data: the old constraint already guaranteed member_urn was unique
-- platform-wide, so no duplicate (tenant_id, member_urn) pair can exist.
ALTER TABLE linkedin_accounts
  DROP CONSTRAINT IF EXISTS linkedin_accounts_member_urn_key;

ALTER TABLE linkedin_accounts
  ADD CONSTRAINT linkedin_accounts_tenant_member_key UNIQUE (tenant_id, member_urn);

COMMIT;
