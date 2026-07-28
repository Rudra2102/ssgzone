ALTER TABLE platform_admins ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false;
ALTER TABLE platform_admins ADD COLUMN IF NOT EXISTS totp_secret TEXT;
