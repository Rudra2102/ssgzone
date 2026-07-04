-- Phase 2 Enterprise Features Migration
-- Email Groups (Mailing Lists/Distribution Groups)
CREATE TABLE email_groups (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES email_groups(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'member', -- member, moderator, admin
    is_active BOOLEAN DEFAULT true,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Auto Responders (Out of Office)
CREATE TABLE auto_responders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE auto_responder_sent (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    sender_email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, sender_email)
);

-- Webhooks for Real-time Events
CREATE TABLE webhooks (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    url VARCHAR(500) NOT NULL,
    events JSONB NOT NULL, -- Array of event types
    secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
    id SERIAL PRIMARY KEY,
    webhook_id INTEGER NOT NULL REFERENCES webhooks(id),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL, -- success, failed, pending
    response_code INTEGER,
    error_message TEXT,
    delivered_at TIMESTAMP DEFAULT NOW()
);

-- Data Retention Policies
CREATE TABLE retention_policies (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    policy_name VARCHAR(255) NOT NULL,
    retention_days INTEGER, -- Delete after N days (null = never delete)
    archive_after_days INTEGER, -- Archive after N days (null = never archive)
    auto_delete BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced Email Tracking
CREATE TABLE email_bounces (
    id SERIAL PRIMARY KEY,
    email_id INTEGER NOT NULL REFERENCES emails(id),
    recipient VARCHAR(255) NOT NULL,
    bounce_type VARCHAR(50) NOT NULL, -- hard, soft, complaint
    reason TEXT,
    bounce_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE spam_complaints (
    id SERIAL PRIMARY KEY,
    email_id INTEGER NOT NULL REFERENCES emails(id),
    complainant VARCHAR(255) NOT NULL,
    complaint_type VARCHAR(50) DEFAULT 'spam',
    feedback_loop_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Shared Mailboxes
CREATE TABLE shared_mailboxes (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

CREATE TABLE shared_mailbox_permissions (
    id SERIAL PRIMARY KEY,
    mailbox_id INTEGER NOT NULL REFERENCES shared_mailboxes(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    permission_level VARCHAR(50) NOT NULL, -- read, write, admin
    granted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(mailbox_id, user_id)
);

-- Add attachment storage references to emails table
ALTER TABLE emails ADD COLUMN IF NOT EXISTS attachments JSONB;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Indexes for performance
CREATE INDEX idx_email_groups_tenant ON email_groups(tenant_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_auto_responders_user ON auto_responders(user_id);
CREATE INDEX idx_webhooks_tenant ON webhooks(tenant_id);
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_retention_policies_tenant ON retention_policies(tenant_id);
CREATE INDEX idx_email_bounces_email ON email_bounces(email_id);
CREATE INDEX idx_spam_complaints_email ON spam_complaints(email_id);
CREATE INDEX idx_shared_mailboxes_tenant ON shared_mailboxes(tenant_id);
CREATE INDEX idx_emails_archived ON emails(is_archived, archived_at);
CREATE INDEX idx_emails_deleted ON emails(is_deleted, deleted_at);
CREATE INDEX idx_emails_tenant_date ON emails(tenant_id, created_at);

-- Add sample retention policy for new tenants
INSERT INTO retention_policies (tenant_id, policy_name, retention_days, archive_after_days, auto_delete, is_active)
SELECT id, 'Default Policy', 2555, 365, false, true -- 7 years retention, 1 year archive
FROM tenants 
WHERE NOT EXISTS (
    SELECT 1 FROM retention_policies WHERE tenant_id = tenants.id
);