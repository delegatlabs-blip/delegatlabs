-- Migration: 006_linkedin_multi_destination
-- TS-2: tenant-scoped LinkedIn accounts, destination model, clone-per-destination posts.
-- Contracts: C-linkedin-destinations, C-linkedin-multi-publish
-- Design: .agent/design/TS-2.md §4
-- Apply after: 005_compliance_gate.sql
--
-- PII classification (new/touched columns):
--   linkedin_accounts.tenant_id          → none (FK)
--   linkedin_accounts.disconnected_at    → none
--   linkedin_accounts.refresh_token_enc  → sensitive (encrypted OAuth secret; nullable, may be unused)
--   linkedin_accounts.last_synced_at     → none
--   oauth_states.tenant_id               → none (FK)
--   linkedin_connections.author_urn      → personal (LinkedIn person/org URN)
--   linkedin_connections.destination_kind→ none
--   linkedin_connections.is_enabled      → none
--   linkedin_connections.can_publish     → none
--   linkedin_connections.role            → none (org ACL role string)
--   linkedin_connections.last_synced_at  → none
--   linkedin_connections.archived_at     → none
--   linkedin_connections.linkedin_account_id → none (FK)
--   posts.source_post_id                 → none (FK)
--   posts.destination_id                 → none (FK)
--
-- Default tenant (seed / AuthContext): 00000000-0000-0000-0000-000000000001

-- =============================================
-- 1. ENUM destination_kind
-- =============================================
DO $$ BEGIN
  CREATE TYPE destination_kind AS ENUM ('personal', 'organization');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 2. post_status: add 'partial' (source aggregate after fan-out)
-- =============================================
-- IF NOT EXISTS is safe to re-run; new enum labels are usable in-transaction on PG 12+.
ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'partial';

-- =============================================
-- 3. linkedin_accounts — tenant binding + disconnect lifecycle
-- =============================================
ALTER TABLE linkedin_accounts
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id),
  ADD COLUMN IF NOT EXISTS disconnected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refresh_token_enc TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Backfill existing OAuth rows onto the default tenant (AuthContext DEFAULT_TENANT_ID).
UPDATE linkedin_accounts
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- One active (non-disconnected) LinkedIn OAuth account per tenant.
CREATE UNIQUE INDEX IF NOT EXISTS uq_linkedin_accounts_active_tenant
  ON linkedin_accounts (tenant_id)
  WHERE disconnected_at IS NULL AND tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_tenant_id
  ON linkedin_accounts (tenant_id);

-- member_urn remains UNIQUE (001) — v1: one LinkedIn member → one row globally.

-- =============================================
-- 4. oauth_states — bind authorize flow to tenant
-- =============================================
ALTER TABLE oauth_states
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_oauth_states_tenant_id
  ON oauth_states (tenant_id);

-- =============================================
-- 5. linkedin_connections → destinations model
-- =============================================
ALTER TABLE linkedin_connections
  ADD COLUMN IF NOT EXISTS author_urn TEXT,
  ADD COLUMN IF NOT EXISTS destination_kind destination_kind,
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_publish BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS linkedin_account_id INT REFERENCES linkedin_accounts(id) ON DELETE SET NULL;

-- Legacy surface kept for seed/backward compat; allow NULL on new destination rows.
ALTER TABLE linkedin_connections
  ALTER COLUMN surface DROP NOT NULL;

-- Drop UNIQUE (tenant_id, surface) so N organization destinations are allowed.
ALTER TABLE linkedin_connections
  DROP CONSTRAINT IF EXISTS linkedin_connections_tenant_id_surface_key;

-- Backfill seed / existing surface rows into destination fields.
-- author_urn left NULL until OAuth sync fills the real person/org URN.
UPDATE linkedin_connections
SET
  destination_kind = CASE surface::text
    WHEN 'personal' THEN 'personal'::destination_kind
    WHEN 'company'  THEN 'organization'::destination_kind
    ELSE destination_kind
  END,
  is_enabled = CASE surface::text
    WHEN 'personal' THEN true
    WHEN 'company'  THEN false
    ELSE COALESCE(is_enabled, false)
  END,
  can_publish = COALESCE(can_publish, false),
  linkedin_account_id = COALESCE(
    linkedin_account_id,
    (
      SELECT la.id
      FROM linkedin_accounts la
      WHERE la.tenant_id = linkedin_connections.tenant_id
        AND la.disconnected_at IS NULL
      ORDER BY la.id
      LIMIT 1
    )
  )
WHERE destination_kind IS NULL
   OR (surface IS NOT NULL AND author_urn IS NULL AND linkedin_account_id IS NULL);

-- At most one non-archived destination per (tenant, author_urn).
-- Rows with NULL author_urn (pre-sync legacy) are excluded from the unique key.
CREATE UNIQUE INDEX IF NOT EXISTS uq_linkedin_connections_tenant_author_active
  ON linkedin_connections (tenant_id, author_urn)
  WHERE archived_at IS NULL AND author_urn IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_linkedin_connections_tenant_active
  ON linkedin_connections (tenant_id)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_linkedin_connections_account
  ON linkedin_connections (linkedin_account_id);

-- =============================================
-- 6. posts — clone-per-destination fan-out columns
-- =============================================
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS source_post_id INT REFERENCES posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destination_id UUID REFERENCES linkedin_connections(id) ON DELETE SET NULL;

-- Idempotency for fan-out clones (C-linkedin-multi-publish §1).
CREATE UNIQUE INDEX IF NOT EXISTS uq_posts_source_destination
  ON posts (source_post_id, destination_id)
  WHERE source_post_id IS NOT NULL AND destination_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_source_post_id
  ON posts (source_post_id);

CREATE INDEX IF NOT EXISTS idx_posts_destination_id
  ON posts (destination_id);

-- =============================================
-- ROLLBACK NOTES (not executed — document only; G10)
-- Apply manually against a local/test DB after human approval.
-- Enum label 'partial' cannot be removed cheaply; leaving it unused is harmless.
-- =============================================
-- -- posts
-- DROP INDEX IF EXISTS idx_posts_destination_id;
-- DROP INDEX IF EXISTS idx_posts_source_post_id;
-- DROP INDEX IF EXISTS uq_posts_source_destination;
-- ALTER TABLE posts DROP COLUMN IF EXISTS destination_id;
-- ALTER TABLE posts DROP COLUMN IF EXISTS source_post_id;
--
-- -- linkedin_connections destinations
-- DROP INDEX IF EXISTS idx_linkedin_connections_account;
-- DROP INDEX IF EXISTS idx_linkedin_connections_tenant_active;
-- DROP INDEX IF EXISTS uq_linkedin_connections_tenant_author_active;
-- ALTER TABLE linkedin_connections
--   DROP COLUMN IF EXISTS linkedin_account_id,
--   DROP COLUMN IF EXISTS archived_at,
--   DROP COLUMN IF EXISTS last_synced_at,
--   DROP COLUMN IF EXISTS role,
--   DROP COLUMN IF EXISTS can_publish,
--   DROP COLUMN IF EXISTS is_enabled,
--   DROP COLUMN IF EXISTS destination_kind,
--   DROP COLUMN IF EXISTS author_urn;
-- -- Restore legacy uniqueness (requires surface NOT NULL on all rows first):
-- -- ALTER TABLE linkedin_connections ALTER COLUMN surface SET NOT NULL;
-- -- ALTER TABLE linkedin_connections ADD CONSTRAINT linkedin_connections_tenant_id_surface_key UNIQUE (tenant_id, surface);
--
-- -- oauth_states
-- DROP INDEX IF EXISTS idx_oauth_states_tenant_id;
-- ALTER TABLE oauth_states DROP COLUMN IF EXISTS tenant_id;
--
-- -- linkedin_accounts
-- DROP INDEX IF EXISTS idx_linkedin_accounts_tenant_id;
-- DROP INDEX IF EXISTS uq_linkedin_accounts_active_tenant;
-- ALTER TABLE linkedin_accounts
--   DROP COLUMN IF EXISTS last_synced_at,
--   DROP COLUMN IF EXISTS refresh_token_enc,
--   DROP COLUMN IF EXISTS disconnected_at,
--   DROP COLUMN IF EXISTS tenant_id;
--
-- -- enums (optional; DROP TYPE fails if still referenced)
-- -- DROP TYPE IF EXISTS destination_kind;
-- -- post_status.'partial' — leave in place (Postgres cannot DROP ENUM value portably)
