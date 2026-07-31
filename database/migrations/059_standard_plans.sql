-- Migration 059: Allow standard/generic billing plans (saas_app_id nullable)
ALTER TABLE saas_billing_plans ALTER COLUMN saas_app_id DROP NOT NULL;
ALTER TABLE saas_billing_plans ADD COLUMN IF NOT EXISTS is_standard BOOLEAN NOT NULL DEFAULT FALSE;

-- Unique constraint: slug unique globally for standard plans, per-saas for saas-specific
-- Drop old unique, add partial unique indexes
ALTER TABLE saas_billing_plans DROP CONSTRAINT IF EXISTS saas_billing_plans_saas_app_id_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_saas_plans_slug_saas ON saas_billing_plans(saas_app_id, slug) WHERE saas_app_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_saas_plans_slug_standard ON saas_billing_plans(slug) WHERE saas_app_id IS NULL;
