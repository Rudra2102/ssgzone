-- Phase 6b: Solo Tenant setup for direct individual clients

INSERT INTO saas_applications (saas_name, saas_slug, api_key, api_secret, permissions, status)
VALUES (
  'Direct Clients',
  'direct',
  'ssg_direct_internal',
  'ssg_direct_secret_internal',
  '{"email":true,"chat":false,"whatsapp":false,"calendar":false,"notifications":true,"file_storage":false}',
  'active'
)
ON CONFLICT DO NOTHING;

INSERT INTO tenant_companies (saas_app_id, company_name, company_slug, domain, admin_name, admin_email, max_users, status)
VALUES (
  (SELECT id FROM saas_applications WHERE saas_slug = 'direct'),
  'Platform Direct Users',
  'platform',
  'ssgzone.in',
  'Platform Admin',
  'admin@ssgzone.in',
  9999,
  'active'
)
ON CONFLICT DO NOTHING;
