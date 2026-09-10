-- Migration: 009_password_credentials
-- Email + password as a first-class way in, alongside the existing OTP and LinkedIn paths.
-- Apply after: 008_linkedin_account_tenant_scope.sql
-- Rollback:    app/db/rollbacks/009_password_credentials_rollback.sql
--              (kept OUTSIDE migrations/ because migrate.py applies every *.sql there)
--
-- Context: the app shipped deliberately passwordless -- a 6-digit emailed code was the
-- only email credential. Password becomes the primary day-to-day credential; the OTP
-- keeps two jobs, verifying the address at signup and authorising a reset.
--
-- Modelled as a credential ON the user, not as a new auth_identities provider. The
-- existing 'email' identity row already asserts "this human controls this address"; a
-- password is one more way to prove it, so the provider enum is untouched. That also
-- keeps the LinkedIn linking rule in users_service.resolve_login working unchanged.
--
-- PII classification (new columns):
--   users.password_hash    -> sensitive (Argon2id verifier; never logged, never returned
--                             by any endpoint or serialiser)
--   users.password_set_at  -> operational (supports "you have no password yet" prompts
--                             and future rotation policy)

BEGIN;

-- NULL means "this account has no password yet" -- true for every user created by the
-- OTP or LinkedIn flows before this migration, and for LinkedIn-only users after it.
-- Those accounts stay reachable through their existing path; nobody is locked out.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash   TEXT,
  ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ;

-- Reset codes are scoped to their own purpose so a code minted for a reset can never be
-- replayed against the sign-in flow, or the reverse. verify_and_consume_otp already
-- filters on purpose; this just gives the reset flow its own value.
ALTER TYPE otp_purpose ADD VALUE IF NOT EXISTS 'password_reset';

COMMIT;
