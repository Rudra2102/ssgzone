CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  tenant_id INTEGER NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number VARCHAR(30) NOT NULL,
  to_number VARCHAR(30) NOT NULL,
  message_text TEXT,
  media_url VARCHAR(500),
  media_type VARCHAR(50),
  wa_message_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  tenant_id INTEGER NOT NULL,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  UNIQUE(user_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_user ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_tenant ON whatsapp_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_user ON whatsapp_contacts(user_id);
