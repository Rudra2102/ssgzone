-- Execute this directly via docker exec
-- Usage: docker exec -i <postgres-container> psql -U postgres -d ssgzone < this_file.sql

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create saas_admin_users table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saas_admin_users_saas_app_id ON saas_admin_users(saas_app_id);
CREATE INDEX IF NOT EXISTS idx_saas_admin_users_email ON saas_admin_users(email);

-- Insert default SaaS admin user for Prashast Hub
INSERT INTO saas_admin_users (saas_app_id, name, email, password)
SELECT 
    id,
    'Prashast Admin',
    'admin@prashast.com',
    crypt('admin123', gen_salt('bf'))
FROM saas_applications 
WHERE name = 'Prashast Hub'
ON CONFLICT (saas_app_id, email) DO NOTHING;

-- Show created users
SELECT email, name, is_active, created_at FROM saas_admin_users;
