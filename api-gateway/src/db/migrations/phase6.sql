-- Phase 6 Migration: Create missing tables and add missing columns

-- Notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_notification_prefs (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  tenant_id TEXT,
  notify_new_email BOOLEAN DEFAULT true,
  notify_chat_mention BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT false,
  email_digest_frequency TEXT DEFAULT 'daily',
  sms_new_email BOOLEAN DEFAULT false,
  phone TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GDPR
CREATE TABLE IF NOT EXISTS gdpr_deletion_queue (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  tenant_id TEXT,
  requested_by TEXT,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  error_message TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS gdpr_deletion_audit (
  id SERIAL PRIMARY KEY,
  deletion_id INTEGER REFERENCES gdpr_deletion_queue(id),
  step TEXT,
  status TEXT,
  details JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_retention_policies (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT UNIQUE NOT NULL,
  inbox_days INTEGER DEFAULT 365,
  sent_days INTEGER DEFAULT 365,
  trash_days INTEGER DEFAULT 30,
  spam_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SaaS Admin
CREATE TABLE IF NOT EXISTS saas_admin_users (
  id SERIAL PRIMARY KEY,
  saas_app_id INTEGER REFERENCES saas_applications(id),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saas_webhook_configs (
  id SERIAL PRIMARY KEY,
  saas_id INTEGER UNIQUE REFERENCES saas_applications(id),
  url TEXT,
  events JSONB DEFAULT '[]',
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saas_api_logs (
  id SERIAL PRIMARY KEY,
  saas_id INTEGER,
  method TEXT,
  endpoint TEXT,
  status_code INTEGER,
  duration_ms INTEGER,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saas_branding (
  id SERIAL PRIMARY KEY,
  saas_id INTEGER UNIQUE REFERENCES saas_applications(id),
  platform_name TEXT,
  tagline TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  custom_domain TEXT,
  support_email TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sso_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  user_id TEXT,
  tenant_id TEXT,
  saas_app_id INTEGER,
  expires_at TIMESTAMPTZ,
  redirect_to TEXT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions
CREATE TABLE IF NOT EXISTS feature_definitions (
  id SERIAL PRIMARY KEY,
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT,
  category TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS saas_feature_permissions (
  id SERIAL PRIMARY KEY,
  saas_id INTEGER REFERENCES saas_applications(id),
  feature_key TEXT,
  is_enabled BOOLEAN DEFAULT true,
  assigned_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(saas_id, feature_key)
);

CREATE TABLE IF NOT EXISTS tenant_feature_permissions (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT,
  feature_key TEXT,
  is_enabled BOOLEAN DEFAULT true,
  assigned_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, feature_key)
);

CREATE TABLE IF NOT EXISTS user_feature_permissions (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  feature_key TEXT,
  is_enabled BOOLEAN DEFAULT true,
  assigned_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_key)
);

-- Support
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT,
  tenant_id TEXT,
  created_by TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_id TEXT,
  actor_type TEXT,
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  tenant_id TEXT,
  ip_address TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform
CREATE TABLE IF NOT EXISTS platform_admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'admin',
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT,
  name TEXT NOT NULL,
  subject TEXT,
  html_body TEXT,
  text_body TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  variables TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_aliases (
  id SERIAL PRIMARY KEY,
  mailbox_id TEXT,
  alias_email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform branding
CREATE TABLE IF NOT EXISTS platform_branding (
  id SERIAL PRIMARY KEY,
  platform_name TEXT,
  tagline TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  sidebar_color TEXT,
  header_color TEXT,
  sidebar_text_color TEXT,
  header_text_color TEXT,
  font_family TEXT,
  font_size TEXT,
  from_name TEXT,
  from_email TEXT,
  email_footer TEXT,
  admin_alert_email TEXT,
  default_max_users INT DEFAULT 100,
  default_mailbox_quota INT DEFAULT 1024,
  session_timeout INT DEFAULT 480,
  password_min_length INT DEFAULT 8,
  logo_url TEXT,
  favicon_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task 4: Missing column guards
ALTER TABLE tenant_companies ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free';
ALTER TABLE tenant_companies ADD COLUMN IF NOT EXISTS email_quota_mb INTEGER DEFAULT 1024;
ALTER TABLE tenant_companies ADD COLUMN IF NOT EXISTS dns_verified BOOLEAN DEFAULT false;
ALTER TABLE saas_applications ADD COLUMN IF NOT EXISTS webhook_secret TEXT;
ALTER TABLE saas_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false;
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS email_type TEXT DEFAULT 'manual';
ALTER TABLE emails ADD COLUMN IF NOT EXISTS to_email TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS subject TEXT;

-- Seed feature_definitions
INSERT INTO feature_definitions (feature_key, feature_name, category) VALUES
  ('email',          'Email',           'communication'),
  ('chat',           'Chat',            'communication'),
  ('whatsapp',       'WhatsApp',        'communication'),
  ('notifications',  'Notifications',   'communication'),
  ('calendar',       'Calendar',        'communication'),
  ('sms',            'SMS',             'communication'),
  ('drive',          'File Storage',    'storage'),
  ('video',          'Video Meetings',  'integration'),
  ('custom_domain',  'Custom Domain',   'integration'),
  ('api_access',     'API Access',      'integration')
ON CONFLICT (feature_key) DO NOTHING;
