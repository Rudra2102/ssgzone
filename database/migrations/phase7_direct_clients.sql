-- Phase 7: Direct Clients — Proper Company-Level Architecture
-- Run on: ssgzone_mail database

-- 1. New direct_clients table (company level)
CREATE TABLE IF NOT EXISTS direct_clients (
  id            SERIAL PRIMARY KEY,
  company_name  TEXT NOT NULL,
  company_slug  TEXT UNIQUE NOT NULL,
  contact_name  TEXT,
  contact_email TEXT,
  allowed_domains TEXT[],          -- e.g. {vastiqonline.in, vastiq.com}
  plan_type     TEXT DEFAULT 'starter',
  status        TEXT DEFAULT 'active',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Rebuild direct_client_api_keys linked to direct_clients (not tenant_users)
DROP TABLE IF EXISTS direct_client_api_keys;
CREATE TABLE direct_client_api_keys (
  id               SERIAL PRIMARY KEY,
  direct_client_id INT NOT NULL REFERENCES direct_clients(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  api_key          TEXT UNIQUE NOT NULL,
  api_secret       TEXT NOT NULL,
  status           TEXT DEFAULT 'active',
  last_used_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Migrate existing VastiQ user from tenant_users into direct_clients
-- (adjust email/name if different)
INSERT INTO direct_clients (company_name, company_slug, contact_name, contact_email, allowed_domains, plan_type)
SELECT 
  'VastiQ', 'vastiq',
  tu.first_name || ' ' || tu.last_name,
  tu.email,
  ARRAY['vastiqonline.in'],
  'starter'
FROM tenant_users tu
JOIN tenant_companies tc ON tc.id = tu.tenant_id
JOIN saas_applications sa ON sa.id = tc.saas_app_id
WHERE sa.saas_slug = 'direct'
  AND tc.company_slug = 'platform'
  AND tu.role = 'user'
LIMIT 1
ON CONFLICT (company_slug) DO NOTHING;
