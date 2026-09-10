-- Migration: 020_billing_payments
-- schema_migrations.version = filename stem: 020_billing_payments
--
-- Razorpay one-time orders for subscription plans and credit packs.
-- Does not change catalog prices, quota columns, or agent_subscriptions rows.
-- Rollback: app/db/rollbacks/020_billing_payments_rollback.sql

BEGIN;

CREATE TABLE IF NOT EXISTS billing_payments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by           TEXT,
  kind                 TEXT NOT NULL,
  plan_id              UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  pack_id              UUID REFERENCES credit_packs(id) ON DELETE SET NULL,
  sku_code             TEXT,
  sku_name             TEXT NOT NULL,
  amount_inr_minor     INTEGER NOT NULL,
  currency             TEXT NOT NULL DEFAULT 'INR',
  status               TEXT NOT NULL DEFAULT 'created',
  fulfilled            BOOLEAN NOT NULL DEFAULT false,
  razorpay_order_id    TEXT UNIQUE,
  razorpay_payment_id  TEXT,
  razorpay_signature   TEXT,
  receipt              TEXT,
  invoice_number       TEXT UNIQUE,
  failure_reason       TEXT,
  buyer_email          TEXT,
  buyer_name           TEXT,
  tenant_name          TEXT,
  paid_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_payments_kind_chk CHECK (kind IN ('subscription', 'credit_pack')),
  CONSTRAINT billing_payments_status_chk CHECK (
    status IN ('created', 'attempted', 'paid', 'failed', 'cancelled')
  ),
  CONSTRAINT billing_payments_amount_chk CHECK (amount_inr_minor >= 0),
  CONSTRAINT billing_payments_currency_chk CHECK (currency = 'INR'),
  CONSTRAINT billing_payments_sku_chk CHECK (
    (kind = 'subscription' AND plan_id IS NOT NULL)
    OR (kind = 'credit_pack' AND pack_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_billing_payments_tenant_created
  ON billing_payments (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_payments_tenant_status
  ON billing_payments (tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_payments_razorpay_payment
  ON billing_payments (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

ALTER TABLE billing_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bpay_select ON billing_payments;
CREATE POLICY bpay_select ON billing_payments FOR SELECT USING (
  app_is_platform_staff() OR app_is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS bpay_write ON billing_payments;
CREATE POLICY bpay_write ON billing_payments FOR ALL USING (
  app_is_platform_staff()
  OR app_tenant_role(tenant_id) IN ('owner', 'admin')
) WITH CHECK (
  app_is_platform_staff()
  OR app_tenant_role(tenant_id) IN ('owner', 'admin')
);

COMMIT;
