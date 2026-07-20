-- Master feature registry
CREATE TABLE IF NOT EXISTS feature_definitions (
  feature_key VARCHAR(50) PRIMARY KEY,
  feature_name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general'
);

INSERT INTO feature_definitions (feature_key, feature_name, category) VALUES
  ('email', 'Email Service', 'communication'),
  ('chat', 'Chat/Messaging', 'communication'),
  ('whatsapp', 'WhatsApp Integration', 'communication'),
  ('calendar', 'Calendar', 'productivity'),
  ('video_call', 'Video Calling', 'communication'),
  ('file_storage', 'File Storage', 'storage'),
  ('notifications', 'Notifications', 'general'),
  ('analytics', 'Analytics Dashboard', 'reporting'),
  ('email_templates', 'Email Templates', 'email'),
  ('bulk_email', 'Bulk Email', 'email'),
  ('api_access', 'API Access', 'developer'),
  ('webhooks', 'Webhooks', 'developer')
ON CONFLICT (feature_key) DO NOTHING;

-- SaaS-level permissions (SuperAdmin assigns to SaaS)
CREATE TABLE IF NOT EXISTS saas_feature_permissions (
  id SERIAL PRIMARY KEY,
  saas_id INTEGER NOT NULL REFERENCES saas_applications(id) ON DELETE CASCADE,
  feature_key VARCHAR(50) NOT NULL REFERENCES feature_definitions(feature_key),
  is_enabled BOOLEAN DEFAULT true,
  assigned_by INTEGER REFERENCES super_admins(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(saas_id, feature_key)
);

-- Tenant-level permissions (SaaS Admin assigns to Tenant, cannot exceed SaaS permissions)
CREATE TABLE IF NOT EXISTS tenant_feature_permissions (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant_companies(id) ON DELETE CASCADE,
  feature_key VARCHAR(50) NOT NULL REFERENCES feature_definitions(feature_key),
  is_enabled BOOLEAN DEFAULT true,
  assigned_by INTEGER,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, feature_key)
);

-- User-level permission overrides (Tenant Admin assigns to User, cannot exceed Tenant permissions)
CREATE TABLE IF NOT EXISTS user_feature_permissions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
  feature_key VARCHAR(50) NOT NULL REFERENCES feature_definitions(feature_key),
  is_enabled BOOLEAN DEFAULT true,
  assigned_by INTEGER,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, feature_key)
);

-- Migrate existing JSONB permissions from saas_applications to saas_feature_permissions
INSERT INTO saas_feature_permissions (saas_id, feature_key, is_enabled)
SELECT 
  sa.id,
  fd.feature_key,
  COALESCE((sa.permissions->>fd.feature_key)::boolean, false)
FROM saas_applications sa
CROSS JOIN feature_definitions fd
WHERE sa.permissions IS NOT NULL
ON CONFLICT (saas_id, feature_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_saas_feat_perm_saas ON saas_feature_permissions(saas_id);
CREATE INDEX IF NOT EXISTS idx_tenant_feat_perm_tenant ON tenant_feature_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_feat_perm_user ON user_feature_permissions(user_id);
