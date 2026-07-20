-- Fix gdpr_deletion_queue to use tenant_users instead of users
DROP TABLE IF EXISTS gdpr_deletion_audit CASCADE;
DROP TABLE IF EXISTS gdpr_deletion_queue CASCADE;

CREATE TABLE gdpr_deletion_queue (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  tenant_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  requested_by INTEGER,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '72 hours'),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deletion_log JSONB DEFAULT '{}',
  error_message TEXT
);

CREATE TABLE gdpr_deletion_audit (
  id SERIAL PRIMARY KEY,
  deletion_id INTEGER REFERENCES gdpr_deletion_queue(id) ON DELETE CASCADE,
  step VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  details JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_queue_status ON gdpr_deletion_queue(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_queue_scheduled ON gdpr_deletion_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_gdpr_queue_tenant ON gdpr_deletion_queue(tenant_id);

CREATE TABLE IF NOT EXISTS email_retention_policies (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL UNIQUE,
  inbox_days INTEGER DEFAULT 365,
  sent_days INTEGER DEFAULT 365,
  trash_days INTEGER DEFAULT 30,
  spam_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retention_tenant ON email_retention_policies(tenant_id);
