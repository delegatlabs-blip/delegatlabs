-- Migration: 003_saas_rls_seed
-- RLS helpers, policies, and default seed data

CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_tenant_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_is_platform_staff() RETURNS BOOLEAN AS $$
  SELECT COALESCE(current_setting('app.is_platform_staff', true), 'false') = 'true';
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_staff_role() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.staff_role', true), '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_is_tenant_member(tid UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = tid AND tm.user_id = app_current_user_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION app_tenant_role(tid UUID) RETURNS TEXT AS $$
  SELECT tm.role::TEXT FROM tenant_members tm
  WHERE tm.tenant_id = tid AND tm.user_id = app_current_user_id()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rule_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_select ON tenants;
CREATE POLICY tenants_select ON tenants FOR SELECT USING (
  app_is_platform_staff() OR id = app_current_tenant_id() OR app_is_tenant_member(id)
);
DROP POLICY IF EXISTS tenants_write ON tenants;
CREATE POLICY tenants_write ON tenants FOR ALL USING (
  app_is_platform_staff() AND app_staff_role() IN ('tech', 'finance')
) WITH CHECK (
  app_is_platform_staff() AND app_staff_role() IN ('tech', 'finance')
);

DROP POLICY IF EXISTS tm_select ON tenant_members;
CREATE POLICY tm_select ON tenant_members FOR SELECT USING (
  app_is_platform_staff() OR tenant_id = app_current_tenant_id() OR app_is_tenant_member(tenant_id)
);
DROP POLICY IF EXISTS tm_write ON tenant_members;
CREATE POLICY tm_write ON tenant_members FOR ALL USING (
  app_is_platform_staff() OR app_tenant_role(tenant_id) IN ('owner', 'admin')
) WITH CHECK (
  app_is_platform_staff() OR app_tenant_role(tenant_id) IN ('owner', 'admin')
);

DROP POLICY IF EXISTS staff_select ON platform_staff;
CREATE POLICY staff_select ON platform_staff FOR SELECT USING (app_is_platform_staff());
DROP POLICY IF EXISTS staff_write ON platform_staff;
CREATE POLICY staff_write ON platform_staff FOR ALL USING (
  app_is_platform_staff() AND app_staff_role() = 'tech'
) WITH CHECK (app_is_platform_staff() AND app_staff_role() = 'tech');

DROP POLICY IF EXISTS asub_all ON agent_subscriptions;
CREATE POLICY asub_all ON agent_subscriptions FOR ALL USING (
  app_is_platform_staff() OR app_is_tenant_member(tenant_id)
) WITH CHECK (app_is_platform_staff() OR app_is_tenant_member(tenant_id));

DROP POLICY IF EXISTS aconf_all ON agent_configs;
CREATE POLICY aconf_all ON agent_configs FOR ALL USING (
  app_is_platform_staff() OR app_is_tenant_member(tenant_id)
) WITH CHECK (app_is_platform_staff() OR app_is_tenant_member(tenant_id));

DROP POLICY IF EXISTS ctx_select ON credit_transactions;
CREATE POLICY ctx_select ON credit_transactions FOR SELECT USING (
  (app_is_platform_staff() AND app_staff_role() IN ('finance', 'tech'))
  OR app_is_tenant_member(tenant_id)
);
DROP POLICY IF EXISTS ctx_write ON credit_transactions;
CREATE POLICY ctx_write ON credit_transactions FOR INSERT WITH CHECK (
  (app_is_platform_staff() AND app_staff_role() IN ('finance', 'tech'))
  OR app_is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS cusage_select ON credit_usage_daily;
CREATE POLICY cusage_select ON credit_usage_daily FOR SELECT USING (
  app_is_platform_staff() OR app_is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS oa_select ON onboarding_answers;
CREATE POLICY oa_select ON onboarding_answers FOR SELECT USING (
  app_is_platform_staff() OR app_is_tenant_member(tenant_id)
);
DROP POLICY IF EXISTS oa_write ON onboarding_answers;
CREATE POLICY oa_write ON onboarding_answers FOR ALL USING (
  app_is_platform_staff() OR app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
) WITH CHECK (
  app_is_platform_staff() OR app_tenant_role(tenant_id) IN ('owner', 'admin', 'editor')
);

DROP POLICY IF EXISTS compliance_select ON compliance_rule_sets;
CREATE POLICY compliance_select ON compliance_rule_sets FOR SELECT USING (true);
DROP POLICY IF EXISTS compliance_write ON compliance_rule_sets;
CREATE POLICY compliance_write ON compliance_rule_sets FOR ALL USING (
  app_is_platform_staff() AND app_staff_role() IN ('tech', 'support')
) WITH CHECK (
  app_is_platform_staff() AND app_staff_role() IN ('tech', 'support')
);

DROP POLICY IF EXISTS appr_all ON approval_items;
CREATE POLICY appr_all ON approval_items FOR ALL USING (
  app_is_platform_staff() OR app_is_tenant_member(tenant_id)
) WITH CHECK (app_is_platform_staff() OR app_is_tenant_member(tenant_id));

DROP POLICY IF EXISTS li_select ON linkedin_connections;
CREATE POLICY li_select ON linkedin_connections FOR SELECT USING (
  app_is_tenant_member(tenant_id)
  OR (app_is_platform_staff() AND app_staff_role() IN ('tech', 'finance'))
);
DROP POLICY IF EXISTS li_write ON linkedin_connections;
CREATE POLICY li_write ON linkedin_connections FOR ALL USING (
  app_is_tenant_member(tenant_id) OR (app_is_platform_staff() AND app_staff_role() = 'tech')
) WITH CHECK (
  app_is_tenant_member(tenant_id) OR (app_is_platform_staff() AND app_staff_role() = 'tech')
);

DROP POLICY IF EXISTS integ_all ON integrations;
CREATE POLICY integ_all ON integrations FOR ALL USING (
  app_is_platform_staff() OR app_is_tenant_member(tenant_id)
) WITH CHECK (app_is_platform_staff() OR app_is_tenant_member(tenant_id));

DROP POLICY IF EXISTS outreach_all ON outreach_counters;
CREATE POLICY outreach_all ON outreach_counters FOR ALL USING (
  app_is_platform_staff() OR app_is_tenant_member(tenant_id)
) WITH CHECK (app_is_platform_staff() OR app_is_tenant_member(tenant_id));

DROP POLICY IF EXISTS inv_select ON invoices;
CREATE POLICY inv_select ON invoices FOR SELECT USING (
  (app_is_platform_staff() AND app_staff_role() IN ('finance', 'tech'))
  OR app_tenant_role(tenant_id) IN ('owner', 'admin')
);
DROP POLICY IF EXISTS inv_write ON invoices;
CREATE POLICY inv_write ON invoices FOR ALL USING (
  app_is_platform_staff() AND app_staff_role() IN ('finance', 'tech')
) WITH CHECK (
  app_is_platform_staff() AND app_staff_role() IN ('finance', 'tech')
);

DROP POLICY IF EXISTS audit_select ON audit_log;
CREATE POLICY audit_select ON audit_log FOR SELECT USING (
  app_is_platform_staff()
  OR (tenant_id IS NOT NULL AND app_tenant_role(tenant_id) IN ('owner', 'admin'))
);
DROP POLICY IF EXISTS audit_insert ON audit_log;
CREATE POLICY audit_insert ON audit_log FOR INSERT WITH CHECK (
  app_is_platform_staff() OR (tenant_id IS NOT NULL AND app_is_tenant_member(tenant_id))
);

INSERT INTO tenants (id, name, account_type, industry, subscription_status, credits_remaining)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Workspace', 'individual', 'tech', 'active', 500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_members (tenant_id, user_id, email, display_name, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'owner', 'owner@local.dev', 'Owner', 'owner'),
  ('00000000-0000-0000-0000-000000000001', 'dev-admin', 'dev@local.dev', 'Dev Admin', 'owner')
ON CONFLICT (tenant_id, user_id) DO NOTHING;

INSERT INTO platform_staff (user_id, email, display_name, role)
VALUES
  ('owner', 'owner@local.dev', 'Platform Owner', 'tech'),
  ('dev-admin', 'dev@local.dev', 'Dev Admin', 'tech')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO agent_subscriptions (tenant_id, agent_kind, tier, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'post_gen', 'pro', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'lead_gen', 'free', 'trialing'),
  ('00000000-0000-0000-0000-000000000001', 'analytics', 'starter', 'active')
ON CONFLICT (tenant_id, agent_kind) DO NOTHING;

INSERT INTO compliance_rule_sets (industry, name, forbidden_phrases, required_disclaimers)
VALUES
  ('finance', 'Finance Core', ARRAY['guaranteed returns', 'risk-free investment', 'get rich quick'], ARRAY['Not financial advice.']),
  ('medical', 'Medical Core', ARRAY['cures cancer', 'FDA approved miracle', 'diagnoses without doctor'], ARRAY['Not medical advice. Consult a professional.'])
ON CONFLICT (industry, name) DO NOTHING;

INSERT INTO billing_plans (agent_kind, name, tier, price_cents, credit_pack)
VALUES
  ('post_gen', 'Post Gen Starter', 'starter', 2900, 200),
  ('post_gen', 'Post Gen Pro', 'pro', 7900, 1000),
  ('lead_gen', 'Lead Gen Starter', 'starter', 4900, 300),
  ('analytics', 'Analytics Starter', 'starter', 1900, 100);

INSERT INTO credit_pack_pricing (credits, price_cents)
VALUES (100, 999), (500, 3999), (2000, 12999);

INSERT INTO linkedin_connections (tenant_id, surface, display_name, health)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'personal', 'Default Personal', 'yellow'),
  ('00000000-0000-0000-0000-000000000001', 'company', 'Company Page', 'pending')
ON CONFLICT (tenant_id, surface) DO NOTHING;

DO $$ BEGIN
  CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;
