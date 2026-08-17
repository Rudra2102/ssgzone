-- Migration 059: Scheduled Emails
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('single', 'broadcast')),
  to_email TEXT,
  to_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  tenant_id UUID,
  broadcast_target TEXT CHECK (broadcast_target IN ('tenants', 'users')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_at ON scheduled_emails(scheduled_at);
