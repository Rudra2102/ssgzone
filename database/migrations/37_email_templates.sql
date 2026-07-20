CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_body TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON email_templates(tenant_id);
