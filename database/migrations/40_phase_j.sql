-- J1: 2FA for super admins
ALTER TABLE super_admins
  ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(100),
  ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false;

-- J2: Email tracking
CREATE TABLE IF NOT EXISTS email_tracking_events (
  id SERIAL PRIMARY KEY,
  email_id INTEGER,
  tenant_id INTEGER,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('open','click')),
  url TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tracking_email ON email_tracking_events(email_id);
CREATE INDEX IF NOT EXISTS idx_tracking_tenant ON email_tracking_events(tenant_id, created_at DESC);

ALTER TABLE emails
  ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- J3: SaaS white-label branding
CREATE TABLE IF NOT EXISTS saas_branding (
  id SERIAL PRIMARY KEY,
  saas_id INTEGER NOT NULL UNIQUE,
  platform_name VARCHAR(100) DEFAULT 'SSGzone Mail',
  tagline VARCHAR(200),
  primary_color VARCHAR(20) DEFAULT '#6366f1',
  secondary_color VARCHAR(20) DEFAULT '#8b5cf6',
  logo_url TEXT,
  favicon_url TEXT,
  custom_domain VARCHAR(255),
  support_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saas_branding ON saas_branding(saas_id);
