-- Migration: Seed PEMS as SaaS Application
-- Uses correct column names matching existing saas_applications table structure

INSERT INTO saas_applications (saas_name, saas_slug, api_key, status)
VALUES ('PEMS', 'pems', 'ssg_live_pems_12345', 'active')
ON CONFLICT (saas_slug) DO UPDATE SET
    saas_name = EXCLUDED.saas_name,
    api_key = EXCLUDED.api_key,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;
