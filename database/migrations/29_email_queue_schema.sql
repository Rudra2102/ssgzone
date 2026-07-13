-- Phase 3: Redis Queue - Email Queue Tracking Table
-- Tracks all queued emails with status, retries, and delivery results

CREATE TABLE IF NOT EXISTS email_delivery_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenant_companies(id) ON DELETE CASCADE,
  job_id VARCHAR(100),                          -- Bull queue job ID
  from_email VARCHAR(255) NOT NULL,
  to_email TEXT NOT NULL,                       -- JSON array for multiple recipients
  subject VARCHAR(500),
  html_content TEXT,
  text_content TEXT,
  attachments JSONB DEFAULT '[]',               -- [{ key, filename, contentType }]
  status VARCHAR(50) DEFAULT 'queued',          -- queued, processing, sent, failed, cancelled
  priority INT DEFAULT 0,                       -- Higher = more priority
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  sent_at TIMESTAMP,
  failed_at TIMESTAMP,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  last_error TEXT,
  ses_message_id VARCHAR(255),                  -- AWS SES message ID on success
  metadata JSONB DEFAULT '{}',                  -- Extra data (template_id, campaign_id, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_status CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_edq_tenant_id ON email_delivery_queue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_edq_status ON email_delivery_queue(status);
CREATE INDEX IF NOT EXISTS idx_edq_scheduled_at ON email_delivery_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_edq_job_id ON email_delivery_queue(job_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_edq_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS edq_updated_at ON email_delivery_queue;
CREATE TRIGGER edq_updated_at
BEFORE UPDATE ON email_delivery_queue
FOR EACH ROW EXECUTE FUNCTION update_edq_timestamp();

-- Queue stats view
CREATE OR REPLACE VIEW email_queue_stats AS
SELECT
  tenant_id,
  status,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries,
  MAX(created_at) as latest
FROM email_delivery_queue
GROUP BY tenant_id, status;

GRANT SELECT, INSERT, UPDATE ON email_delivery_queue TO postgres;
GRANT SELECT ON email_queue_stats TO postgres;
