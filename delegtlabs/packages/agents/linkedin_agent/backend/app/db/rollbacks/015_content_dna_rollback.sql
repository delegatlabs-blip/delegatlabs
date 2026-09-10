-- Rollback for: 015_content_dna
-- Apply with:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f app/db/rollbacks/015_content_dna_rollback.sql
--
-- Drops the Content DNA table only. onboarding_answers is untouched.

BEGIN;

DROP POLICY IF EXISTS cdna_write ON content_dna;
DROP POLICY IF EXISTS cdna_select ON content_dna;
DROP TABLE IF EXISTS content_dna;

DELETE FROM schema_migrations WHERE version = '015_content_dna';

COMMIT;
