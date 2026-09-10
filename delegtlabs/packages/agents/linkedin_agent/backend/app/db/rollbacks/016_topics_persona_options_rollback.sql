-- Rollback for: 016_topics_persona_options
-- Apply with:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f app/db/rollbacks/016_topics_persona_options_rollback.sql
--
-- Reverse of 016. DELETE FROM topics WHERE tenant_id IS NOT NULL is required before
-- restoring UNIQUE (name)/(slug). Does not delete 001 seed rows (tenant_id IS NULL).
-- Nulls posts.topic_id for Gemini-linked posts (ON DELETE SET NULL). Local/test only.

BEGIN;

DROP POLICY IF EXISTS topics_write ON topics;
DROP POLICY IF EXISTS topics_select ON topics;
DROP POLICY IF EXISTS ttr_write ON tenant_topic_replacements;
DROP POLICY IF EXISTS ttr_select ON tenant_topic_replacements;

DROP TABLE IF EXISTS tenant_topic_replacements;

DELETE FROM topics WHERE tenant_id IS NOT NULL;

DROP INDEX IF EXISTS idx_topics_tenant_active;
DROP INDEX IF EXISTS idx_topics_tenant_id;
DROP INDEX IF EXISTS uq_topics_seed_name;
DROP INDEX IF EXISTS uq_topics_seed_slug;
DROP INDEX IF EXISTS uq_topics_tenant_name;
DROP INDEX IF EXISTS uq_topics_tenant_slug;

ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_options_shape_chk;
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_selected_option_in_options_chk;
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_active_requires_option_chk;

ALTER TABLE topics DROP COLUMN IF EXISTS selected_option;
ALTER TABLE topics DROP COLUMN IF EXISTS options;
ALTER TABLE topics DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE topics ADD CONSTRAINT topics_name_key UNIQUE (name);
ALTER TABLE topics ADD CONSTRAINT topics_slug_key UNIQUE (slug);

ALTER TABLE topics ALTER COLUMN is_active SET DEFAULT true;

DELETE FROM schema_migrations WHERE version = '016_topics_persona_options';

COMMIT;
