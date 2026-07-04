-- Migration: GDPR Right to Be Forgotten Queue
-- Task 1.3: Data Deletion Compliance

-- Create GDPR deletion queue table
CREATE TABLE gdpr_deletion_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    tenant_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    requested_by INTEGER REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '72 hours'),
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    deletion_log JSONB DEFAULT '{}',
    error_message TEXT NULL
);

-- Create indexes
CREATE INDEX idx_gdpr_deletion_queue_status ON gdpr_deletion_queue(status);
CREATE INDEX idx_gdpr_deletion_queue_scheduled ON gdpr_deletion_queue(scheduled_for);

-- Create audit trail for GDPR deletions
CREATE TABLE gdpr_deletion_audit (
    id SERIAL PRIMARY KEY,
    deletion_id INTEGER REFERENCES gdpr_deletion_queue(id),
    step VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    details JSONB,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);