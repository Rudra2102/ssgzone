-- Tenant Management Tables for SSGzone
-- Tables for managing tenant companies, users, and departments

-- Tenant Companies Table
CREATE TABLE IF NOT EXISTS tenant_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saas_app_id UUID NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_slug VARCHAR(100) NOT NULL UNIQUE,
    domain VARCHAR(255) NOT NULL UNIQUE,
    admin_name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) NOT NULL UNIQUE,
    admin_phone VARCHAR(20),
    max_users INTEGER DEFAULT 100,
    plan_type VARCHAR(50) DEFAULT 'starter',
    status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tenant Users Table
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant_companies(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user',
    department_id UUID,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_picture VARCHAR(500),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, username),
    UNIQUE(tenant_id, email)
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant_companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    head_user_id UUID,
    parent_department_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Add foreign key constraint for department head
ALTER TABLE departments ADD CONSTRAINT fk_departments_head_user 
    FOREIGN KEY (head_user_id) REFERENCES tenant_users(id) ON DELETE SET NULL;

-- Add foreign key constraint for user department
ALTER TABLE tenant_users ADD CONSTRAINT fk_tenant_users_department 
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Tenant Communication Settings Table
CREATE TABLE IF NOT EXISTS tenant_communication_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant_companies(id) ON DELETE CASCADE UNIQUE,
    settings JSONB NOT NULL DEFAULT '{
        "email_enabled": true,
        "chat_enabled": true,
        "whatsapp_enabled": false,
        "notifications_enabled": true
    }',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- SaaS Applications Table (for reference)
CREATE TABLE IF NOT EXISTS saas_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    webhook_url VARCHAR(500),
    domain_prefix VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    api_secret VARCHAR(255) NOT NULL,
    webhook_secret VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tenant_companies_saas_app ON tenant_companies(saas_app_id);
CREATE INDEX IF NOT EXISTS idx_tenant_companies_slug ON tenant_companies(company_slug);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);
CREATE INDEX IF NOT EXISTS idx_tenant_users_department ON tenant_users(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_head ON departments(head_user_id);
CREATE INDEX IF NOT EXISTS idx_saas_applications_slug ON saas_applications(slug);

-- Triggers for updated_at
CREATE TRIGGER update_tenant_companies_updated_at BEFORE UPDATE ON tenant_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_users_updated_at BEFORE UPDATE ON tenant_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_communication_settings_updated_at BEFORE UPDATE ON tenant_communication_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saas_applications_updated_at BEFORE UPDATE ON saas_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample Data for Testing
INSERT INTO saas_applications (name, slug, description, domain_prefix, api_key, api_secret, webhook_secret) VALUES
('PEMS', 'pems', 'Prashast Enterprise Management System', 'pems', 'ssg_live_pems_12345', 'ssg_secret_pems_67890', 'whk_pems_abcdef')
ON CONFLICT (slug) DO NOTHING;

-- Get the PEMS app ID for sample tenant
DO $$
DECLARE
    pems_app_id UUID;
    sample_tenant_id UUID;
    dept_id UUID;
BEGIN
    SELECT id INTO pems_app_id FROM saas_applications WHERE slug = 'pems';
    
    -- Insert sample tenant company
    INSERT INTO tenant_companies (saas_app_id, company_name, company_slug, domain, admin_name, admin_email, max_users, plan_type)
    VALUES (pems_app_id, 'Prashast Academy', 'prashastacademy', 'prashastacademy.pems.ssgzone.in', 'Dr. Pradeep Singh', 'admin@prashastacademy.pems.ssgzone.in', 500, 'enterprise')
    ON CONFLICT (company_slug) DO NOTHING
    RETURNING id INTO sample_tenant_id;
    
    -- If tenant already exists, get its ID
    IF sample_tenant_id IS NULL THEN
        SELECT id INTO sample_tenant_id FROM tenant_companies WHERE company_slug = 'prashastacademy';
    END IF;
    
    -- Insert sample departments
    INSERT INTO departments (tenant_id, name, description) VALUES
    (sample_tenant_id, 'Administration', 'Administrative department managing overall operations'),
    (sample_tenant_id, 'Academic', 'Academic department handling educational activities'),
    (sample_tenant_id, 'IT Support', 'Information Technology support and maintenance'),
    (sample_tenant_id, 'Finance', 'Financial management and accounting')
    ON CONFLICT (tenant_id, name) DO NOTHING;
    
    -- Get IT department ID for sample user
    SELECT id INTO dept_id FROM departments WHERE tenant_id = sample_tenant_id AND name = 'IT Support';
    
    -- Insert sample users
    INSERT INTO tenant_users (tenant_id, username, email, first_name, last_name, phone, role, department_id, password_hash) VALUES
    (sample_tenant_id, 'admin', 'admin@prashastacademy.pems.ssgzone.in', 'Dr. Pradeep', 'Singh', '+91-9876543210', 'admin', dept_id, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
    (sample_tenant_id, 'namrata.singh', 'namrata.singh@prashastacademy.pems.ssgzone.in', 'Namrata', 'Singh', '+91-9876543211', 'manager', dept_id, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
    (sample_tenant_id, 'rajesh.kumar', 'rajesh.kumar@prashastacademy.pems.ssgzone.in', 'Rajesh', 'Kumar', '+91-9876543212', 'user', dept_id, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
    ON CONFLICT (tenant_id, username) DO NOTHING;
    
    -- Insert communication settings
    INSERT INTO tenant_communication_settings (tenant_id) VALUES (sample_tenant_id)
    ON CONFLICT (tenant_id) DO NOTHING;
END $$;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;