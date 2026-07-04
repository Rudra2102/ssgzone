-- Mail Server Failover Support
CREATE TABLE email_queue (
    id SERIAL PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    sender VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT,
    html_body TEXT,
    headers JSONB,
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, sent, failed
    assigned_node VARCHAR(100),
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    processing_started TIMESTAMP,
    sent_at TIMESTAMP,
    error_message TEXT
);

CREATE TABLE failover_events (
    id SERIAL PRIMARY KEY,
    failed_node VARCHAR(100) NOT NULL,
    takeover_node VARCHAR(100) NOT NULL,
    event_time TIMESTAMP DEFAULT NOW(),
    emails_transferred INTEGER DEFAULT 0,
    recovery_time_seconds INTEGER
);

CREATE INDEX idx_email_queue_status ON email_queue(status, assigned_node);
CREATE INDEX idx_email_queue_pending ON email_queue(status, created_at) WHERE status = 'pending';
CREATE INDEX idx_failover_events_time ON failover_events(event_time);