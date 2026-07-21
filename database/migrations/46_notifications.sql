CREATE TABLE IF NOT EXISTS user_notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  tenant_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  link VARCHAR(300),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_notification_prefs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL UNIQUE,
  tenant_id INTEGER NOT NULL,
  notify_new_email BOOLEAN DEFAULT true,
  notify_chat_mention BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT false,
  email_digest_frequency VARCHAR(10) DEFAULT 'daily',
  sms_new_email BOOLEAN DEFAULT false,
  phone VARCHAR(30),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON user_notifications(user_id, is_read);
