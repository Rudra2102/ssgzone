ALTER TABLE emails ADD COLUMN IF NOT EXISTS email_type VARCHAR(20) DEFAULT 'sent';
UPDATE emails SET email_type = 'sent' WHERE email_type IS NULL;
CREATE INDEX IF NOT EXISTS idx_emails_email_type ON emails(email_type);
