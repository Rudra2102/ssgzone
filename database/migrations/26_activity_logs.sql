-- Create activity_logs table for dashboard system activity tracking
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id),
  tenant_id UUID REFERENCES tenant_companies(id),
  saas_app_id INTEGER REFERENCES saas_applications(id),
  action_details JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_tenant_id ON activity_logs(tenant_id);
CREATE INDEX idx_activity_logs_type ON activity_logs(type);
CREATE INDEX idx_activity_logs_saas_app_id ON activity_logs(saas_app_id);

-- Create view for recent activities
CREATE OR REPLACE VIEW recent_activities AS
SELECT 
  id, type, title, description, user_id, tenant_id, 
  timestamp, created_at
FROM activity_logs
ORDER BY timestamp DESC
LIMIT 100;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_activity_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS activity_logs_updated_at_trigger ON activity_logs;
CREATE TRIGGER activity_logs_updated_at_trigger
BEFORE UPDATE ON activity_logs
FOR EACH ROW
EXECUTE FUNCTION update_activity_logs_updated_at();
