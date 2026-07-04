-- Migration: DMARC Custom Policies per Tenant
-- Task 1.2: Custom DMARC Policy Management

-- Create tenant-specific DMARC policies table
CREATE TABLE tenant_dmarc_policies (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    policy VARCHAR(10) NOT NULL CHECK (policy IN ('none', 'quarantine', 'reject')),
    subdomain_policy VARCHAR(10) CHECK (subdomain_policy IN ('none', 'quarantine', 'reject')),
    percentage INTEGER DEFAULT 100 CHECK (percentage >= 0 AND percentage <= 100),
    rua_email VARCHAR(255), -- Aggregate reports email
    ruf_email VARCHAR(255), -- Forensic reports email
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id)
);

-- Create trigger for updated_at
CREATE TRIGGER update_tenant_dmarc_policies_updated_at 
BEFORE UPDATE ON tenant_dmarc_policies 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();