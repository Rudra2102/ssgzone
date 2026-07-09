-- Email Storage Schema Migration
-- Purpose: Add email_storage table to track S3/MinIO references
-- Date: 2026-07-09

-- Email Storage Table
CREATE TABLE IF NOT EXISTS email_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenant_companies(id) ON DELETE CASCADE,
  storage_key VARCHAR(500) NOT NULL,
  storage_type VARCHAR(50) NOT NULL, -- 'email', 'attachment'
  file_size BIGINT NOT NULL,
  content_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,
  archive_location VARCHAR(500), -- Glacier/Archive path
  
  CONSTRAINT valid_storage_type CHECK (storage_type IN ('email', 'attachment'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_storage_email_id ON email_storage(email_id);
CREATE INDEX IF NOT EXISTS idx_email_storage_tenant_id ON email_storage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_storage_created_at ON email_storage(created_at);
CREATE INDEX IF NOT EXISTS idx_email_storage_archived_at ON email_storage(archived_at);
CREATE INDEX IF NOT EXISTS idx_email_storage_storage_type ON email_storage(storage_type);

-- Archive Policy View
CREATE OR REPLACE VIEW email_storage_archive_policy AS
SELECT 
  id,
  email_id,
  tenant_id,
  storage_key,
  storage_type,
  file_size,
  created_at,
  CASE 
    WHEN created_at < CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'archive_to_glacier'
    WHEN created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' THEN 'delete'
    ELSE 'keep_hot'
  END as action
FROM email_storage
WHERE archived_at IS NULL;

-- Storage Usage View (per tenant)
CREATE OR REPLACE VIEW tenant_storage_usage AS
SELECT 
  tenant_id,
  storage_type,
  COUNT(*) as file_count,
  SUM(file_size) as total_bytes,
  ROUND(SUM(file_size)::numeric / 1024 / 1024 / 1024, 2) as total_gb,
  MAX(created_at) as last_upload
FROM email_storage
WHERE archived_at IS NULL
GROUP BY tenant_id, storage_type;

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_email_storage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    action, table_name, record_id, tenant_id, user_id, changes, created_at
  ) VALUES (
    TG_OP, 'email_storage', NEW.id, NEW.tenant_id, NULL,
    jsonb_build_object(
      'storage_key', NEW.storage_key,
      'file_size', NEW.file_size,
      'storage_type', NEW.storage_type,
      'content_type', NEW.content_type
    ),
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS email_storage_audit_trigger ON email_storage;
CREATE TRIGGER email_storage_audit_trigger
AFTER INSERT OR UPDATE ON email_storage
FOR EACH ROW EXECUTE FUNCTION audit_email_storage();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON email_storage TO postgres;
GRANT SELECT ON email_storage_archive_policy TO postgres;
GRANT SELECT ON tenant_storage_usage TO postgres;
