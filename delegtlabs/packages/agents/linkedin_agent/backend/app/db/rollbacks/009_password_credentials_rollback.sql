-- Rollback: 009_password_credentials
--
-- Drops every stored password. Users who signed up with email+password after 009 keep no
-- usable credential and must fall back to the OTP sign-in path.
--
-- otp_purpose keeps its 'password_reset' value: Postgres cannot remove an enum label, and
-- leaving it is harmless once nothing issues codes with that purpose.

BEGIN;

ALTER TABLE users
  DROP COLUMN IF EXISTS password_hash,
  DROP COLUMN IF EXISTS password_set_at;

COMMIT;
