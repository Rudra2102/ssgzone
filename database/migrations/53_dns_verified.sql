ALTER TABLE tenant_companies ADD COLUMN IF NOT EXISTS dns_verified BOOLEAN DEFAULT false;
