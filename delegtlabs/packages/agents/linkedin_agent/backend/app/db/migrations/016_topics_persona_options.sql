-- Migration: 016_topics_persona_options
-- schema_migrations.version = 016_topics_persona_options (inserted by migrate.py, not this file)
--
-- TS-15: tenant-scoped Gemini topic options. Additive. Does NOT DELETE the six
-- 001 seed rows (React New Feature, Next.js New Feature, React vs Next.js,
-- Dev Opinion, Performance Tip, Migration Story).
--
-- Verified PG unique names on linkedin_agent (001 UNIQUE columns):
--   topics_name_key UNIQUE (name), topics_slug_key UNIQUE (slug)

ALTER TABLE topics ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS selected_option TEXT NULL;

ALTER TABLE topics ALTER COLUMN is_active SET DEFAULT false;

ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_name_key;
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_slug_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_topics_seed_name
  ON topics (name) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_topics_seed_slug
  ON topics (slug) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_topics_tenant_name
  ON topics (tenant_id, name) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_topics_tenant_slug
  ON topics (tenant_id, slug) WHERE tenant_id IS NOT NULL;

ALTER TABLE topics ADD CONSTRAINT topics_options_shape_chk CHECK (
  CASE
    WHEN jsonb_typeof(options) IS DISTINCT FROM 'array' THEN false
    WHEN tenant_id IS NULL THEN true
    ELSE jsonb_array_length(options) = 5
  END
);

ALTER TABLE topics ADD CONSTRAINT topics_selected_option_in_options_chk CHECK (
  selected_option IS NULL
  OR options @> jsonb_build_array(jsonb_build_object('value', selected_option))
);

ALTER TABLE topics ADD CONSTRAINT topics_active_requires_option_chk CHECK (
  tenant_id IS NULL
  OR is_active IS NOT TRUE
  OR selected_option IS NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_topic_replacements (
  tenant_id         UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  seed_replaced_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_tenant_id ON topics (tenant_id);
CREATE INDEX IF NOT EXISTS idx_topics_tenant_active
  ON topics (tenant_id) WHERE tenant_id IS NOT NULL AND is_active = true;

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_topic_replacements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS topics_select ON topics;
CREATE POLICY topics_select ON topics FOR SELECT USING (
  app_is_platform_staff()
  OR (tenant_id IS NOT NULL AND app_is_tenant_member(tenant_id))
  OR (
    tenant_id IS NULL
    AND app_current_tenant_id() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM tenant_topic_replacements ttr
      WHERE ttr.tenant_id = app_current_tenant_id()
    )
  )
);

DROP POLICY IF EXISTS topics_write ON topics;
CREATE POLICY topics_write ON topics FOR ALL USING (
  app_is_platform_staff()
  OR (
    tenant_id IS NOT NULL
    AND app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
  )
) WITH CHECK (
  app_is_platform_staff()
  OR (
    tenant_id IS NOT NULL
    AND tenant_id = app_current_tenant_id()
    AND app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
  )
);

DROP POLICY IF EXISTS ttr_select ON tenant_topic_replacements;
CREATE POLICY ttr_select ON tenant_topic_replacements FOR SELECT USING (
  app_is_platform_staff() OR app_is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS ttr_write ON tenant_topic_replacements;
CREATE POLICY ttr_write ON tenant_topic_replacements FOR ALL USING (
  app_is_platform_staff() OR app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
) WITH CHECK (
  app_is_platform_staff() OR app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
);
