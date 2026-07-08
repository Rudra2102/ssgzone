-- Deletion Management Tables and Columns

-- Add deletion tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_reason VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS permanent_deletion_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP;

-- Add deletion tracking columns to tenant_companies table
ALTER TABLE tenant_companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE tenant_companies ADD COLUMN IF NOT EXISTS deletion_reason VARCHAR(255);
ALTER TABLE tenant_companies ADD COLUMN IF NOT EXISTS permanent_deletion_date TIMESTAMP;

-- Create deletion logs table
CREATE TABLE IF NOT EXISTS deletion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_logs_action ON deletion_logs(action);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_created_at ON deletion_logs(created_at);

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_users_status_deleted ON users(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_permanent_deletion_date ON users(permanent_deletion_date);
CREATE INDEX IF NOT EXISTS idx_tenant_companies_status_deleted ON tenant_companies(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tenant_companies_permanent_deletion_date ON tenant_companies(permanent_deletion_date);

-- Create view for active users only
CREATE OR REPLACE VIEW active_users AS
SELECT * FROM users WHERE status != 'deleted';

-- Create view for active tenants only
CREATE OR REPLACE VIEW active_tenants AS
SELECT * FROM tenant_companies WHERE status != 'deleted';

-- Create view for deleted records pending permanent deletion
CREATE OR REPLACE VIEW pending_permanent_deletion AS
SELECT 
    'user' as type,
    id,
    email as identifier,
    deleted_at,
    permanent_deletion_date,
    EXTRACT(DAY FROM (permanent_deletion_date - NOW())) as days_until_permanent_deletion
FROM users
WHERE status = 'deleted' AND permanent_deletion_date > NOW()
UNION ALL
SELECT 
    'tenant' as type,
    id,
    company_slug as identifier,
    deleted_at,
    permanent_deletion_date,
    EXTRACT(DAY FROM (permanent_deletion_date - NOW())) as days_until_permanent_deletion
FROM tenant_companies
WHERE status = 'deleted' AND permanent_deletion_date > NOW();
