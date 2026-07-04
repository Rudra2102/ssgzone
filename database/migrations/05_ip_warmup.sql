-- IP Warmup Management
CREATE TABLE ip_warmup_status (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'warming', -- warming, active, suspended
    start_date TIMESTAMP NOT NULL DEFAULT NOW(),
    current_daily_limit INTEGER NOT NULL DEFAULT 50,
    emails_sent_today INTEGER NOT NULL DEFAULT 0,
    total_emails_sent INTEGER NOT NULL DEFAULT 0,
    last_email_sent TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ip_warmup_status ON ip_warmup_status(ip_address, status);
CREATE INDEX idx_ip_warmup_daily ON ip_warmup_status(emails_sent_today, current_daily_limit);