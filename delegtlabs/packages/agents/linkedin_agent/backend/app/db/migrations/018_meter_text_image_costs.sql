-- Migration: 018_meter_text_image_costs
-- schema_migrations.version = filename stem: 018_meter_text_image_costs
--   (inserted by migrate.py, not this file)
--
-- TS-22 Q-9 A (G10 approved): reprice existing meter keys only.
-- text_post 1→10, image_post 10→30. Does NOT INSERT action_keys.
-- Does NOT rewrite 013. Does NOT touch manual_post.
-- Rollback: app/db/rollbacks/018_meter_text_image_costs_rollback.sql

BEGIN;

UPDATE credit_action_costs
SET credits = 10, updated_at = NOW()
WHERE action_key = 'text_post';

UPDATE credit_action_costs
SET credits = 30, updated_at = NOW()
WHERE action_key = 'image_post';

COMMIT;
