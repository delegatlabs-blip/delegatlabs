-- Rollback for: 007_user_auth_tenancy
--
-- Deliberately NOT stored in app/db/migrations/ -- migrate.py applies every *.sql in
-- that directory in sorted order (app/db/migrate.py:64), so a rollback file living
-- there would be executed as part of a normal forward migration run.
--
-- Apply with:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f app/db/rollbacks/007_user_auth_tenancy_rollback.sql
--
-- DESTRUCTIVE: drops every user account, login identity, and active session created
-- since 007 was applied. Tenants and their content survive; the tenant_members rows
-- that pointed at those users do not.

BEGIN;

-- Drop dependent objects first (FKs cascade from users/tenants).
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS email_otps;
DROP TABLE IF EXISTS auth_identities;

-- Remove membership rows that reference a users.id, keeping the pre-007 synthetic
-- members ('owner', 'dev-admin') seeded by 003_saas_rls_seed.sql.
DELETE FROM tenant_members
WHERE user_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

ALTER TABLE tenants DROP COLUMN IF EXISTS created_by_user_id;

-- oauth_states: drop the intent discriminator and its constraints.
DELETE FROM oauth_states WHERE intent = 'login';
ALTER TABLE oauth_states DROP CONSTRAINT IF EXISTS oauth_states_tenant_intent_check;
ALTER TABLE oauth_states DROP CONSTRAINT IF EXISTS oauth_states_intent_check;
ALTER TABLE oauth_states DROP COLUMN IF EXISTS intent;

DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS otp_purpose;
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS auth_provider;

DELETE FROM schema_migrations WHERE version = '007_user_auth_tenancy';

COMMIT;
