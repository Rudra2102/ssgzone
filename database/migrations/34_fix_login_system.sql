-- Fix saas_admin_users: UUID → INTEGER to match saas_applications.id
DROP TABLE IF EXISTS saas_admin_users CASCADE;

CREATE TABLE saas_admin_users (
  id SERIAL PRIMARY KEY,
  saas_app_id INTEGER NOT NULL REFERENCES saas_applications(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_saas_admin_email ON saas_admin_users(email);
CREATE INDEX idx_saas_admin_saas_app ON saas_admin_users(saas_app_id);

-- SSO tokens table (secure, signed, expiring, one-time use)
CREATE TABLE IF NOT EXISTS sso_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  saas_app_id INTEGER NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sso_token ON sso_tokens(token);
CREATE INDEX idx_sso_expires ON sso_tokens(expires_at);
