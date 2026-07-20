CREATE TABLE IF NOT EXISTS saas_webhook_configs (
  id SERIAL PRIMARY KEY,
  saas_id INTEGER NOT NULL UNIQUE,
  url VARCHAR(500) NOT NULL,
  events TEXT[] DEFAULT ARRAY['email.received','email.sent','user.created'],
  secret VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saas_api_logs (
  id SERIAL PRIMARY KEY,
  saas_id INTEGER,
  method VARCHAR(10),
  endpoint VARCHAR(255),
  status_code INTEGER,
  duration_ms INTEGER,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_api_logs_saas ON saas_api_logs(saas_id, created_at DESC);
