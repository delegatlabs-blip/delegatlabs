-- Rollback for: 018_meter_text_image_costs
-- Apply with:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f app/db/rollbacks/018_meter_text_image_costs_rollback.sql
--
-- Reverse of 018. Restores 013 meter integers (text_post=1, image_post=10).
-- Does NOT DELETE rows. Does NOT touch manual_post.
-- Local/test only unless a human names another environment (G10).

BEGIN;

UPDATE credit_action_costs
SET credits = 1, updated_at = NOW()
WHERE action_key = 'text_post';

UPDATE credit_action_costs
SET credits = 10, updated_at = NOW()
WHERE action_key = 'image_post';

DELETE FROM schema_migrations WHERE version = '018_meter_text_image_costs';

COMMIT;
