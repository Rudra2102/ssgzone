-- Integration Logs Table
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_action ON integration_logs(action);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at);

-- SaaS Applications Table (if not exists)
CREATE TABLE IF NOT EXISTS saas_applications (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    secret_key VARCHAR(255) NOT NULL UNIQUE,
    webhook_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_applications_status ON saas_applications(status);

-- Add ssgzone_tenant_id to tenant_companies if not exists
ALTER TABLE tenant_companies ADD COLUMN IF NOT EXISTS saas_app_id VARCHAR(100);
ALTER TABLE tenant_companies ADD COLUMN IF NOT EXISTS saas_external_id VARCHAR(255);

-- Add ssgzone_user_id to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS saas_external_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_companies_saas_app_id ON tenant_companies(saas_app_id);
CREATE INDEX IF NOT EXISTS idx_users_saas_external_id ON users(saas_external_id);
