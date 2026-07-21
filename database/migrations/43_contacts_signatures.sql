CREATE TABLE IF NOT EXISTS user_contacts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  tenant_id INTEGER NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(150),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE TABLE IF NOT EXISTS user_signatures (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL UNIQUE,
  tenant_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT 'Default',
  html_body TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_contacts_user ON user_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contacts_tenant ON user_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_contacts_email ON user_contacts(email);
CREATE INDEX IF NOT EXISTS idx_user_signatures_user ON user_signatures(user_id);
