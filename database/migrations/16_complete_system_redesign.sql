-- SSGzone Mail - Complete System Redesign
-- Phase 1: Multi-tier Architecture Implementation

-- Drop existing tables to recreate with new structure
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS saas_applications CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- 1. Super Admin Users (Platform Administrators)
CREATE TABLE super_admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. SaaS Applications (Managed by Super Admin)
CREATE TABLE saas_applications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    api_key VARCHAR(255) UNIQUE NOT NULL,
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255),
    max_tenants INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_by INTEGER REFERENCES super_admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tenants/Companies (Managed by Super Admin)
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    saas_id INTEGER REFERENCES saas_applications(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    domain VARCHAR(255) NOT NULL, -- company.saas.ssgzone.in
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    admin_email VARCHAR(255) NOT NULL,
    admin_password_hash VARCHAR(255) NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    admin_phone VARCHAR(20),
    
    -- Subscription & Limits
    subscription_plan VARCHAR(50) DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'pro', 'enterprise')),
    max_users INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 10,
    max_emails_per_month INTEGER DEFAULT 1000,
    
    -- Settings
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    email_signature TEXT,
    
    -- Status & Metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'trial')),
    trial_ends_at TIMESTAMP,
    created_by INTEGER REFERENCES super_admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(saas_id, slug)
);

-- 4. Tenant Admins (Auto-created with tenant)
CREATE TABLE tenant_admins (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    
    -- Permissions
    permissions JSONB DEFAULT '{
        "users": {"create": true, "read": true, "update": true, "delete": true},
        "settings": {"read": true, "update": true},
        "analytics": {"read": true},
        "api_keys": {"create": true, "read": true, "update": true, "delete": true},
        "billing": {"read": true}
    }',
    
    -- Status & Metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, username)
);

-- 5. End Users (Managed by Tenant Admin)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    
    -- Organization Info
    department VARCHAR(100),
    designation VARCHAR(100),
    employee_id VARCHAR(50),
    manager_email VARCHAR(255),
    
    -- Email Settings
    storage_quota_mb INTEGER DEFAULT 1024,
    storage_used_mb INTEGER DEFAULT 0,
    email_signature TEXT,
    auto_reply_enabled BOOLEAN DEFAULT FALSE,
    auto_reply_message TEXT,
    
    -- Status & Metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP,
    created_by INTEGER REFERENCES tenant_admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, username)
);

-- 6. API Keys for Integration (Managed by Tenant Admin)
CREATE TABLE tenant_api_keys (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    key_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    api_secret VARCHAR(255) NOT NULL,
    
    -- Permissions
    permissions JSONB DEFAULT '{
        "send_email": true,
        "create_user": true,
        "read_user": true,
        "update_user": false,
        "delete_user": false
    }',
    
    -- Rate Limiting
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    
    -- Status & Metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
    last_used TIMESTAMP,
    expires_at TIMESTAMP,
    created_by INTEGER REFERENCES tenant_admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Email Messages (Enhanced)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    thread_id VARCHAR(255),
    
    -- Email Content
    folder VARCHAR(50) DEFAULT 'INBOX',
    subject TEXT,
    sender VARCHAR(255) NOT NULL,
    recipients TEXT[] NOT NULL,
    cc_recipients TEXT[],
    bcc_recipients TEXT[],
    reply_to VARCHAR(255),
    body_text TEXT,
    body_html TEXT,
    
    -- Attachments & Metadata
    attachments JSONB,
    size_bytes BIGINT DEFAULT 0,
    flags VARCHAR(50)[] DEFAULT ARRAY['\\Recent'],
    labels VARCHAR(100)[],
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    
    -- Tracking
    is_read BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_spam BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    sent_at TIMESTAMP,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Usage Analytics (Enhanced)
CREATE TABLE usage_analytics (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Email Statistics
    emails_sent INTEGER DEFAULT 0,
    emails_received INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    emails_spam INTEGER DEFAULT 0,
    
    -- User Statistics
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    
    -- Storage Statistics
    storage_used_mb BIGINT DEFAULT 0,
    storage_quota_mb BIGINT DEFAULT 0,
    
    -- API Statistics
    api_calls INTEGER DEFAULT 0,
    api_errors INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, date)
);

-- 9. Audit Logs (Enhanced)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    user_id INTEGER,
    admin_id INTEGER,
    super_admin_id INTEGER REFERENCES super_admins(id),
    
    -- Action Details
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    details JSONB,
    
    -- Request Info
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'error')),
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. System Settings
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INTEGER REFERENCES super_admins(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_tenant ON messages(tenant_id);
CREATE INDEX idx_messages_folder ON messages(folder);
CREATE INDEX idx_messages_received ON messages(received_at);
CREATE INDEX idx_messages_thread ON messages(thread_id);

CREATE INDEX idx_tenants_saas ON tenants(saas_id);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_domain ON tenants(domain);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

CREATE INDEX idx_usage_analytics_tenant_date ON usage_analytics(tenant_id, date);
CREATE INDEX idx_api_keys_tenant ON tenant_api_keys(tenant_id);

-- Update Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_super_admins_updated_at BEFORE UPDATE ON super_admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saas_applications_updated_at BEFORE UPDATE ON saas_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_admins_updated_at BEFORE UPDATE ON tenant_admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_api_keys_updated_at BEFORE UPDATE ON tenant_api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();