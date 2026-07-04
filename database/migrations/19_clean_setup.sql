-- Clean Database Setup for SSGzone
-- Remove sample data and create proper super admin

-- Create super_admins table if not exists
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Clear existing sample data
DELETE FROM tenant_users WHERE tenant_id IN (SELECT id FROM tenant_companies WHERE company_slug = 'prashastacademy');
DELETE FROM departments WHERE tenant_id IN (SELECT id FROM tenant_companies WHERE company_slug = 'prashastacademy');
DELETE FROM tenant_communication_settings WHERE tenant_id IN (SELECT id FROM tenant_companies WHERE company_slug = 'prashastacademy');
DELETE FROM tenant_companies WHERE company_slug = 'prashastacademy';
DELETE FROM saas_applications WHERE slug = 'pems';

-- Create super admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO super_admins (username, email, full_name, password_hash) VALUES
('superadmin', 'superadmin@ssgzone.in', 'Super Administrator', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;

-- Create trigger for super_admins updated_at
CREATE TRIGGER update_super_admins_updated_at BEFORE UPDATE ON super_admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;