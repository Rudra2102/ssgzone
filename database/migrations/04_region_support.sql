-- Add region support for data residency compliance
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS data_region VARCHAR(20) DEFAULT 'us-east-1';
ALTER TABLE saas_applications ADD COLUMN IF NOT EXISTS default_region VARCHAR(20) DEFAULT 'us-east-1';

-- Add region compliance tracking
CREATE TABLE IF NOT EXISTS region_compliance_log (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    operation VARCHAR(100) NOT NULL,
    region VARCHAR(20) NOT NULL,
    compliance_status VARCHAR(20) NOT NULL,
    logged_at TIMESTAMP DEFAULT NOW()
);

-- Index for region queries
CREATE INDEX IF NOT EXISTS idx_tenants_region ON tenants(data_region);
CREATE INDEX IF NOT EXISTS idx_compliance_log_tenant ON region_compliance_log(tenant_id);

-- Update existing tenants with default region
UPDATE tenants SET data_region = 'us-east-1' WHERE data_region IS NULL;