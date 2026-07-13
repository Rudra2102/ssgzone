-- Phase 7: Webhook System Schema

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenant_companies(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  events JSONB NOT NULL DEFAULT '[]',         -- ["email.received", "email.bounced", ...]
  secret VARCHAR(255),                         -- HMAC signing secret
  is_active BOOLEAN DEFAULT true,
  max_retries INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',        -- pending, success, failed
  response_code INT,
  response_body TEXT,
  error_message TEXT,
  attempt_count INT DEFAULT 0,
  next_retry_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_delivery_status CHECK (status IN ('pending', 'success', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_wd_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_wd_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_wd_next_retry ON webhook_deliveries(next_retry_at) WHERE status = 'pending';

-- Auto-update updated_at on webhooks
CREATE OR REPLACE FUNCTION update_webhook_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_updated_at ON webhooks;
CREATE TRIGGER webhook_updated_at
BEFORE UPDATE ON webhooks
FOR EACH ROW EXECUTE FUNCTION update_webhook_timestamp();

GRANT SELECT, INSERT, UPDATE, DELETE ON webhooks TO postgres;
GRANT SELECT, INSERT, UPDATE ON webhook_deliveries TO postgres;
