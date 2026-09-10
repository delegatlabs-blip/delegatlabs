-- Rollback: 008_linkedin_account_tenant_scope
--
-- Restores the platform-wide UNIQUE (member_urn). This FAILS if more than one tenant has
-- since connected the same LinkedIn member -- which is exactly the state 008 was written
-- to permit. Resolve those duplicates before rolling back.
--
-- The rows 008 deleted are NOT restored: they held encrypted access tokens that cannot be
-- reconstructed. Affected tenants must reconnect LinkedIn.

BEGIN;

ALTER TABLE linkedin_accounts
  DROP CONSTRAINT IF EXISTS linkedin_accounts_tenant_member_key;

ALTER TABLE linkedin_accounts
  ADD CONSTRAINT linkedin_accounts_member_urn_key UNIQUE (member_urn);

COMMIT;
