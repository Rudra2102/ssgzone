-- Migration: Create saas_admin_users table
-- Description: Table to store SaaS Admin Portal credentials for each SaaS application

CREATE TABLE IF NOT EXISTS saas_admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saas_app_id UUID NOT NULL REFERENCES saas_applications(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(saas_app_id, email)
);

-- Create index for faster lookups
CREATE INDEX idx_saas_admin_users_saas_app_id ON saas_admin_users(saas_app_id);
CREATE INDEX idx_saas_admin_users_email ON saas_admin_users(email);

-- Insert default SaaS admin user for Prashast Hub (if exists)
-- Password: admin123 (hashed with pgcrypto)
INSERT INTO saas_admin_users (saas_app_id, name, email, password)
SELECT 
    id,
    'Prashast Admin',
    'admin@prashast.com',
    crypt('admin123', gen_salt('bf'))
FROM saas_applications 
WHERE name = 'Prashast Hub'
ON CONFLICT (saas_app_id, email) DO NOTHING;

COMMENT ON TABLE saas_admin_users IS 'Stores SaaS Admin Portal login credentials for each SaaS application';
COMMENT ON COLUMN saas_admin_users.saas_app_id IS 'Reference to the SaaS application this admin belongs to';
COMMENT ON COLUMN saas_admin_users.password IS 'Bcrypt hashed password using pgcrypto';
