-- Rollback for: 020_billing_payments
-- Apply with:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f app/db/rollbacks/020_billing_payments_rollback.sql

BEGIN;

DROP POLICY IF EXISTS bpay_write ON billing_payments;
DROP POLICY IF EXISTS bpay_select ON billing_payments;
DROP TABLE IF EXISTS billing_payments;

DELETE FROM schema_migrations WHERE version = '020_billing_payments';

COMMIT;
