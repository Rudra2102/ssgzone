CREATE TABLE IF NOT EXISTS email_rules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  condition_field VARCHAR(20) NOT NULL CHECK (condition_field IN ('from', 'subject', 'body')),
  condition_operator VARCHAR(20) NOT NULL CHECK (condition_operator IN ('contains', 'equals', 'starts_with')),
  condition_value VARCHAR(255) NOT NULL,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('move', 'star', 'mark_read', 'mark_unread')),
  action_value VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_rules_user ON email_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_email_rules_tenant ON email_rules(tenant_id);
