-- Migration: 015_content_dna
-- schema_migrations.version = 015_content_dna
--
-- Additive Content DNA store for adaptive onboarding (TS-12).
-- Does NOT drop or rewrite onboarding_answers / settings.onboarding_answers.

CREATE TABLE IF NOT EXISTS content_dna (
  tenant_id           UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  profile             JSONB NOT NULL DEFAULT '{}'::jsonb,
  session             JSONB NOT NULL DEFAULT '{}'::jsonb,
  onboarding_version  TEXT NOT NULL DEFAULT 'adaptive-1',
  updated_by          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_dna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cdna_select ON content_dna;
CREATE POLICY cdna_select ON content_dna FOR SELECT USING (
  app_is_platform_staff() OR app_is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS cdna_write ON content_dna;
CREATE POLICY cdna_write ON content_dna FOR ALL USING (
  app_is_platform_staff() OR app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
) WITH CHECK (
  app_is_platform_staff() OR app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
);
