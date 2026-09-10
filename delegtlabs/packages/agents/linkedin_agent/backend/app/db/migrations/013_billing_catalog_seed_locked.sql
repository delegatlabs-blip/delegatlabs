-- Migration: 013_billing_catalog_seed_locked
-- schema_migrations.version = filename stem: 013_billing_catalog_seed_locked
--
-- UPSERT locked dummy catalog (C-BILLING-CATALOG §5, USER-AMENDED).
-- ON CONFLICT DO UPDATE so 011's DO NOTHING rows are corrected.
-- Does NOT assign agent_subscriptions.plan_id (Q-8 A).
-- Does NOT grant wallet credits or insert credit_transactions (Q-8 A, Q-6 A).
-- Does NOT DELETE leftover 011 rows (G10; pack_id FKs).

-- =============================================
-- METER
-- =============================================
INSERT INTO credit_action_costs (
  action_key, label, description, agent_kind, credits, is_active, sort_order
) VALUES
  ('manual_post', 'Manual post',
   'You write the copy, we publish it to LinkedIn.',
   'post_gen', 50, true, 10),
  ('text_post', 'AI text post',
   'Agent writes the post from your topics and persona.',
   'post_gen', 1, true, 20),
  ('image_post', 'AI post with image',
   'AI text plus a generated image. Image generation dominates the unit cost.',
   'post_gen', 10, true, 30)
ON CONFLICT (action_key) DO UPDATE SET
  credits = EXCLUDED.credits,
  is_active = true,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  updated_at = NOW();

UPDATE credit_action_costs
SET is_active = false, updated_at = NOW()
WHERE action_key IN ('text_regenerate', 'image_regenerate');

-- =============================================
-- SUBSCRIPTION PLANS
-- features locked to [] (do not keep 011 "Unlimited manual posts").
-- Other 011 identity columns (rollover, seats, accounts, badge, sort_order,
-- description) are set on INSERT and left alone on conflict for paid SKUs.
-- =============================================
INSERT INTO subscription_plans (
  code, name, description, agent_kind, tier,
  price_inr_minor, price_usd_minor,
  billing_period, monthly_credits, rollover_months, seats, linkedin_accounts,
  features, badge, is_active, is_default, sort_order
) VALUES
  ('free', 'Free trial',
   'Try the agent before paying. 60 credits, once.',
   'post_gen', 'free',
   0, 0,
   'monthly', 60, 0, 1, 1,
   '[]'::jsonb, NULL, true, true, 10),

  ('starter', 'Starter',
   'For one person posting a few times a week.',
   'post_gen', 'starter',
   49900, 499,
   'monthly', 1000, 1, 1, 1,
   '[]'::jsonb, NULL, true, false, 20),

  ('growth', 'Growth',
   'Daily posting with images, small team.',
   'post_gen', 'pro',
   149900, 1499,
   'monthly', 3000, 2, 3, 3,
   '[]'::jsonb, 'Most popular', true, false, 30),

  ('scale', 'Scale',
   'Agencies and multi-brand publishing.',
   'post_gen', 'enterprise',
   399900, 3999,
   'monthly', 8000, 3, 10, 10,
   '[]'::jsonb, NULL, true, false, 40)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  price_inr_minor = EXCLUDED.price_inr_minor,
  price_usd_minor = EXCLUDED.price_usd_minor,
  monthly_credits = EXCLUDED.monthly_credits,
  features = EXCLUDED.features,
  is_active = true,
  is_default = EXCLUDED.is_default,
  description = CASE
    WHEN subscription_plans.code = 'free' THEN EXCLUDED.description
    ELSE subscription_plans.description
  END,
  updated_at = NOW();

-- =============================================
-- CREDIT PACKS
-- =============================================
INSERT INTO credit_packs (
  code, name, price_inr_minor, price_usd_minor, credits, bonus_credits, is_active
) VALUES
  ('taster_100', 'Taster', 10000, 100, 200, 0, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  price_inr_minor = EXCLUDED.price_inr_minor,
  price_usd_minor = EXCLUDED.price_usd_minor,
  credits = EXCLUDED.credits,
  bonus_credits = EXCLUDED.bonus_credits,
  is_active = true,
  updated_at = NOW();

UPDATE credit_packs
SET is_active = false, updated_at = NOW()
WHERE code IN ('taster_99', 'creator_499', 'pro_999', 'agency_2499');
