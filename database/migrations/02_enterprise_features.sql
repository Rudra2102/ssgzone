-- Enterprise Features Migration

-- Email Groups/Mailing Lists
CREATE TABLE email_groups (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    group_name VARCHAR(255) NOT NULL,
    group_email VARCHAR(255) UNIQUE NOT NULL,
    members JSONB NOT NULL, -- Array of email addresses
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auto Responders (Out of Office)
CREATE TABLE auto_responders (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT false,
    subject VARCHAR(255),
    message TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhooks
CREATE TABLE webhooks (
    id SERIAL PRIMARY KEY,
    saas_id INTEGER REFERENCES saas_applications(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- email.received, email.bounced, user.created, etc.
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(saas_id, event_type)
);

-- Webhook Delivery Logs
CREATE TABLE webhook_deliveries (
    id SERIAL PRIMARY KEY,
    webhook_id INTEGER REFERENCES webhooks(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- success, failed, retry
    http_status INTEGER,
    error_message TEXT,
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Retention Policies
CREATE TABLE tenant_retention_policies (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    retention_days INTEGER NOT NULL DEFAULT 365,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bounce Tracking
CREATE TABLE email_bounces (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255),
    recipient VARCHAR(255) NOT NULL,
    bounce_type VARCHAR(20) NOT NULL, -- hard, soft, spam
    bounce_reason TEXT,
    tenant_id INTEGER REFERENCES tenants(id),
    bounced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shared Mailboxes
CREATE TABLE shared_mailboxes (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    mailbox_email VARCHAR(255) UNIQUE NOT NULL,
    mailbox_name VARCHAR(255) NOT NULL,
    authorized_users JSONB NOT NULL, -- Array of user IDs with access
    permissions JSONB, -- Read, write, delete permissions per user
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Regional Data Residency
ALTER TABLE tenants ADD COLUMN data_region VARCHAR(50) DEFAULT 'us-east-1';
ALTER TABLE users ADD COLUMN data_region VARCHAR(50) DEFAULT 'us-east-1';

-- Enhanced message storage with S3 references
ALTER TABLE messages ADD COLUMN attachment_storage JSONB; -- S3 keys and metadata
ALTER TABLE messages ADD COLUMN search_indexed BOOLEAN DEFAULT false;

-- Indexes for performance
CREATE INDEX idx_email_groups_tenant ON email_groups(tenant_id);
CREATE INDEX idx_auto_responders_email ON auto_responders(user_email);
CREATE INDEX idx_webhooks_saas_event ON webhooks(saas_id, event_type);
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_email_bounces_recipient ON email_bounces(recipient);
CREATE INDEX idx_email_bounces_tenant ON email_bounces(tenant_id);
CREATE INDEX idx_shared_mailboxes_tenant ON shared_mailboxes(tenant_id);
CREATE INDEX idx_messages_search_indexed ON messages(search_indexed);

-- Update triggers
CREATE TRIGGER update_email_groups_updated_at BEFORE UPDATE ON email_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auto_responders_updated_at BEFORE UPDATE ON auto_responders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shared_mailboxes_updated_at BEFORE UPDATE ON shared_mailboxes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();