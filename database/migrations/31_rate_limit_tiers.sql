-- Phase 8: Tiered Rate Limiting Schema

-- Rate limit tiers configuration
CREATE TABLE IF NOT EXISTS rate_limit_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name VARCHAR(50) NOT NULL UNIQUE,       -- free, pro, enterprise, custom
  requests_per_minute INT NOT NULL DEFAULT 60,
  requests_per_hour INT NOT NULL DEFAULT 1000,
  emails_per_day INT NOT NULL DEFAULT 500,
  emails_per_month INT NOT NULL DEFAULT 10000,
  max_attachment_size_mb INT NOT NULL DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tiers
INSERT INTO rate_limit_tiers (tier_name, requests_per_minute, requests_per_hour, emails_per_day, emails_per_month, max_attachment_size_mb)
VALUES
  ('free',       30,   500,    100,   1000,   5),
  ('pro',        120,  5000,   2000,  50000,  25),
  ('enterprise', 600,  50000,  20000, 500000, 100)
ON CONFLICT (tier_name) DO NOTHING;

-- SaaS-level overrides (override default tier limits per SaaS app)
CREATE TABLE IF NOT EXISTS saas_rate_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saas_id UUID NOT NULL REFERENCES saas_applications(id) ON DELETE CASCADE,
  requests_per_minute INT,
  requests_per_hour INT,
  emails_per_day INT,
  emails_per_month INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(saas_id)
);

CREATE INDEX IF NOT EXISTS idx_saas_rate_overrides_saas_id ON saas_rate_overrides(saas_id);

GRANT SELECT ON rate_limit_tiers TO postgres;
GRANT SELECT, INSERT, UPDATE ON saas_rate_overrides TO postgres;
