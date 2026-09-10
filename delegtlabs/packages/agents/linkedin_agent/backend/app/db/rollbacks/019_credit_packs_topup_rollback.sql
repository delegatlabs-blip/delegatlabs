-- Rollback for: 019_credit_packs_topup
-- Apply with:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f app/db/rollbacks/019_credit_packs_topup_rollback.sql
--
-- Reverse of 019. Deletes the two volume packs. Restores taster_100 sort_order
-- to the 013 default (0). Does NOT touch taster_100 price/credits.
-- Local/test only unless a human names another environment (G10).

BEGIN;

DELETE FROM credit_packs
WHERE code IN ('starter_pack_200', 'growth_pack_500');

UPDATE credit_packs
SET sort_order = 0, updated_at = NOW()
WHERE code = 'taster_100';

DELETE FROM schema_migrations WHERE version = '019_credit_packs_topup';

COMMIT;
