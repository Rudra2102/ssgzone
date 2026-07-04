-- Add permissions system to SaaS applications
-- This allows SuperAdmin to control which features each SaaS app can access

-- Add permissions column to saas_applications table
ALTER TABLE saas_applications ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "email": true,
  "chat": true,
  "whatsapp": false,
  "calendar": false,
  "notifications": true,
  "file_storage": true
}'::jsonb;

-- Add updated_at column if not exists
ALTER TABLE saas_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_saas_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_saas_applications_updated_at_trigger ON saas_applications;
CREATE TRIGGER update_saas_applications_updated_at_trigger 
BEFORE UPDATE ON saas_applications 
FOR EACH ROW EXECUTE FUNCTION update_saas_applications_updated_at();

-- Update existing PEMS app with default permissions
UPDATE saas_applications 
SET permissions = '{
  "email": true,
  "chat": true,
  "whatsapp": true,
  "calendar": true,
  "notifications": true,
  "file_storage": true
}'::jsonb
WHERE slug = 'pems';

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;