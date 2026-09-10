-- Rollback: 013_billing_catalog_seed_locked
-- schema_migrations.version deleted: 013_billing_catalog_seed_locked
--
-- Run BEFORE 012 rollback. Does not drop catalog tables.
-- Assumes 012 dual-price columns are still present.
-- Local/test only unless a human explicitly approves another environment (G10).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM schema_migrations WHERE version = '011_billing_catalog_seed'
  ) THEN
    -- Restore 011 meter values that 013 overwrote.
    UPDATE credit_action_costs SET
      credits = 0,
      is_active = true,
      label = 'Manual post',
      description = 'You write the copy, we publish it to LinkedIn. No model call, so it is free.',
      updated_at = NOW()
    WHERE action_key = 'manual_post';

    UPDATE credit_action_costs SET
      credits = 1,
      is_active = true,
      updated_at = NOW()
    WHERE action_key = 'text_post';

    UPDATE credit_action_costs SET
      credits = 5,
      is_active = true,
      updated_at = NOW()
    WHERE action_key = 'image_post';

    UPDATE credit_action_costs SET
      is_active = true,
      updated_at = NOW()
    WHERE action_key IN ('text_regenerate', 'image_regenerate');

    -- Restore 011 plan values (dual-price equivalent of 011 INR price_minor).
    UPDATE subscription_plans SET
      price_inr_minor = 0,
      price_usd_minor = 0,
      monthly_credits = 30,
      is_default = true,
      is_active = true,
      description = 'Try the agent before paying. 30 credits, once.',
      features = '["30 credits, one time", "30 AI text posts or 6 image posts", "Unlimited manual posts", "1 LinkedIn account"]'::jsonb,
      updated_at = NOW()
    WHERE code = 'free';

    UPDATE subscription_plans SET
      price_inr_minor = 49900,
      price_usd_minor = 499,
      monthly_credits = 600,
      is_default = false,
      is_active = true,
      features = '["600 credits / month", "600 AI text posts or 120 image posts", "Unlimited manual posts", "Credits roll over 1 month", "1 LinkedIn account"]'::jsonb,
      updated_at = NOW()
    WHERE code = 'starter';

    UPDATE subscription_plans SET
      price_inr_minor = 149900,
      price_usd_minor = 1499,
      monthly_credits = 2000,
      is_default = false,
      is_active = true,
      features = '["2,000 credits / month", "2,000 AI text posts or 400 image posts", "Unlimited manual posts", "Credits roll over 2 months", "Priority generation queue", "3 seats, 3 LinkedIn accounts"]'::jsonb,
      updated_at = NOW()
    WHERE code = 'growth';

    UPDATE subscription_plans SET
      price_inr_minor = 399900,
      price_usd_minor = 3999,
      monthly_credits = 6000,
      is_default = false,
      is_active = true,
      features = '["6,000 credits / month", "6,000 AI text posts or 1,200 image posts", "Unlimited manual posts", "Credits roll over 3 months", "Priority queue + compliance pack", "10 seats, 10 LinkedIn accounts"]'::jsonb,
      updated_at = NOW()
    WHERE code = 'scale';

    -- 013-only pack. ON DELETE SET NULL on credit_transactions.pack_id.
    DELETE FROM credit_packs WHERE code = 'taster_100';

    UPDATE credit_packs SET
      is_active = true,
      updated_at = NOW()
    WHERE code IN ('taster_99', 'creator_499', 'pro_999', 'agency_2499');
  ELSE
    DELETE FROM credit_action_costs
    WHERE action_key IN ('manual_post', 'text_post', 'image_post');
    DELETE FROM subscription_plans
    WHERE code IN ('free', 'starter', 'growth', 'scale');
    DELETE FROM credit_packs
    WHERE code = 'taster_100';
  END IF;
END $$;

DELETE FROM schema_migrations WHERE version = '013_billing_catalog_seed_locked';
