-- Migration: 011_billing_catalog_seed
-- Dummy INR catalog so the Post Gen Subscription/Credits tabs render real rows.
-- Every number here is editable from the internal admin panel; nothing in the
-- application reads a hard-coded price.
--
-- Pricing anchor: 1 credit = Rs 1 at the entry pack, discounted by volume.
-- Meter weights come from measured unit cost (see credit_action_costs below):
--   AI text post  ~ Rs 0.04  (gemini-2.0-flash-lite, ~3K in / 700 out)
--   AI image post ~ Rs 1.80  (image model at $0.02/image)
--   Manual post   ~ Rs 0.00  (no model call; LinkedIn publish API is free)

-- =============================================
-- THE METER
-- =============================================
INSERT INTO credit_action_costs (action_key, label, description, agent_kind, credits, sort_order)
VALUES
  ('manual_post', 'Manual post',
   'You write the copy, we publish it to LinkedIn. No model call, so it is free.',
   'post_gen', 0, 10),
  ('text_post', 'AI text post',
   'Agent writes the post from your topics and persona.',
   'post_gen', 1, 20),
  ('image_post', 'AI post with image',
   'AI text plus a generated image. Image generation dominates the unit cost.',
   'post_gen', 5, 30),
  ('text_regenerate', 'Regenerate text',
   'Rewrite an existing draft.',
   'post_gen', 1, 40),
  ('image_regenerate', 'Regenerate image',
   'New image for an existing post.',
   'post_gen', 4, 50)
ON CONFLICT (action_key) DO NOTHING;

-- =============================================
-- SUBSCRIPTION PLANS
-- =============================================
INSERT INTO subscription_plans (
  code, name, description, agent_kind, tier, currency, price_minor,
  billing_period, monthly_credits, rollover_months, seats, linkedin_accounts,
  features, badge, is_active, is_default, sort_order
) VALUES
  ('free', 'Free trial',
   'Try the agent before paying. 30 credits, once.',
   'post_gen', 'free', 'INR', 0, 'monthly', 30, 0, 1, 1,
   '["30 credits, one time", "30 AI text posts or 6 image posts", "Unlimited manual posts", "1 LinkedIn account"]'::jsonb,
   NULL, true, true, 10),

  ('starter', 'Starter',
   'For one person posting a few times a week.',
   'post_gen', 'starter', 'INR', 49900, 'monthly', 600, 1, 1, 1,
   '["600 credits / month", "600 AI text posts or 120 image posts", "Unlimited manual posts", "Credits roll over 1 month", "1 LinkedIn account"]'::jsonb,
   NULL, true, false, 20),

  ('growth', 'Growth',
   'Daily posting with images, small team.',
   'post_gen', 'pro', 'INR', 149900, 'monthly', 2000, 2, 3, 3,
   '["2,000 credits / month", "2,000 AI text posts or 400 image posts", "Unlimited manual posts", "Credits roll over 2 months", "Priority generation queue", "3 seats, 3 LinkedIn accounts"]'::jsonb,
   'Most popular', true, false, 30),

  ('scale', 'Scale',
   'Agencies and multi-brand publishing.',
   'post_gen', 'enterprise', 'INR', 399900, 'monthly', 6000, 3, 10, 10,
   '["6,000 credits / month", "6,000 AI text posts or 1,200 image posts", "Unlimited manual posts", "Credits roll over 3 months", "Priority queue + compliance pack", "10 seats, 10 LinkedIn accounts"]'::jsonb,
   NULL, true, false, 40)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- CREDIT PACKS (top-ups, never expire)
-- =============================================
INSERT INTO credit_packs (
  code, name, description, currency, price_minor, credits, bonus_credits,
  badge, is_active, sort_order
) VALUES
  ('taster_99', 'Taster',
   '100 AI text posts, or 20 posts with images.',
   'INR', 9900, 100, 0, NULL, true, 10),

  ('creator_499', 'Creator',
   '550 AI text posts, or 110 posts with images.',
   'INR', 49900, 500, 50, NULL, true, 20),

  ('pro_999', 'Pro',
   '1,200 AI text posts, or 240 posts with images.',
   'INR', 99900, 1000, 200, 'Best value', true, 30),

  ('agency_2499', 'Agency',
   '3,250 AI text posts, or 650 posts with images.',
   'INR', 249900, 2500, 750, NULL, true, 40)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- Put the seeded workspace on a real plan so the tab is not empty in dev.
-- =============================================
UPDATE agent_subscriptions
SET plan_id = (SELECT id FROM subscription_plans WHERE code = 'growth'),
    current_period_start = COALESCE(current_period_start, NOW())
WHERE agent_kind = 'post_gen' AND plan_id IS NULL;
