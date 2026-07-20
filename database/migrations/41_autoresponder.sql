CREATE TABLE IF NOT EXISTS auto_responders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  tenant_id INTEGER NOT NULL,
  subject VARCHAR(255) NOT NULL DEFAULT 'Out of Office',
  message TEXT NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auto_responder_sent (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sender_email)
);

CREATE INDEX IF NOT EXISTS idx_autoresponder_user ON auto_responders(user_id);
CREATE INDEX IF NOT EXISTS idx_autoresponder_active ON auto_responders(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_autoresponder_sent ON auto_responder_sent(user_id, sender_email);
