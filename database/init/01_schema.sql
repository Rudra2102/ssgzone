-- ssgzone Mail Database Schema

-- Database is created by Docker environment variables
-- Using database: ssgzone_mail

-- SaaS Applications Table
CREATE TABLE IF NOT EXISTS saas_applications (
    id SERIAL PRIMARY KEY,
    saas_name VARCHAR(255) NOT NULL,
    saas_slug VARCHAR(100) UNIQUE NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenants (Companies) Table
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    saas_id INTEGER REFERENCES saas_applications(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    tenant_slug VARCHAR(100) NOT NULL,
    domain VARCHAR(255) NOT NULL, -- e.g., nabc.lms.ssgzone.com
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(saas_id, tenant_slug)
);

-- Users (Mailboxes) Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    storage_quota BIGINT DEFAULT 1073741824, -- 1GB in bytes
    storage_used BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- DNS Records Table
CREATE TABLE IF NOT EXISTS dns_records (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    record_type VARCHAR(10) NOT NULL, -- MX, SPF, DKIM, etc.
    name VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    ttl INTEGER DEFAULT 3600,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    folder VARCHAR(50) DEFAULT 'INBOX',
    subject TEXT,
    sender VARCHAR(255),
    recipients TEXT[], -- Array of recipient emails
    body_text TEXT,
    body_html TEXT,
    attachments JSONB,
    size BIGINT,
    flags VARCHAR(50)[], -- Array of IMAP flags
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    saas_id INTEGER REFERENCES saas_applications(id),
    tenant_id INTEGER REFERENCES tenants(id),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage Analytics Table
CREATE TABLE IF NOT EXISTS usage_analytics (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    emails_sent INTEGER DEFAULT 0,
    emails_received INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, date)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_folder ON messages(folder);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_dns_records_tenant ON dns_records(tenant_id);
CREATE INDEX idx_usage_analytics_date ON usage_analytics(date);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saas_applications_updated_at BEFORE UPDATE ON saas_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dns_records_updated_at BEFORE UPDATE ON dns_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
