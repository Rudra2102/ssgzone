-- SSGzone Mail - Sample Data for Testing
-- This file creates sample data for the new multi-tier system

-- 1. Create Super Admin
INSERT INTO super_admins (username, email, password_hash, full_name, phone) VALUES 
('superadmin', 'admin@ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'SSGzone Administrator', '+91-9876543210');

-- 2. Create SaaS Applications
INSERT INTO saas_applications (name, slug, description, api_key, webhook_url, created_by) VALUES 
('Learning Management System', 'lms', 'Complete LMS solution for educational institutions', 'lms_api_key_2024_secure', 'https://lms.example.com/webhooks/ssgzone', 1),
('Rupyo Financial Platform', 'rupyo', 'Employee financial wellness platform', 'rupyo_api_key_2024_secure', 'https://rupyo.example.com/webhooks/ssgzone', 1),
('Customer Relationship Management', 'crm', 'Advanced CRM for business management', 'crm_api_key_2024_secure', 'https://crm.example.com/webhooks/ssgzone', 1);

-- 3. Create Tenants with Admin Credentials
INSERT INTO tenants (
    saas_id, company_name, slug, domain, 
    admin_email, admin_password_hash, admin_name, admin_phone,
    subscription_plan, max_users, max_storage_gb, max_emails_per_month,
    created_by
) VALUES 
-- LMS Tenants
(1, 'Prashast Academy', 'prashastacademy', 'prashastacademy.lms.ssgzone.in', 
 'admin@prashastacademy.lms.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'Prashast Admin', '+91-9876543211',
 'pro', 50, 50, 5000, 1),

(1, 'NABC Institute', 'nabc', 'nabc.lms.ssgzone.in',
 'admin@nabc.lms.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'NABC Admin', '+91-9876543212',
 'enterprise', 100, 100, 10000, 1),

-- Rupyo Tenants  
(2, 'ABC Developers', 'abcdevelopers', 'abcdevelopers.rupyo.ssgzone.in',
 'admin@abcdevelopers.rupyo.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'ABC Admin', '+91-9876543213',
 'basic', 25, 25, 2500, 1),

-- CRM Tenants
(3, 'TechCorp Solutions', 'techcorp', 'techcorp.crm.ssgzone.in',
 'admin@techcorp.crm.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'TechCorp Admin', '+91-9876543214',
 'pro', 75, 75, 7500, 1);

-- 4. Create Tenant Admins (Auto-created with tenants)
INSERT INTO tenant_admins (tenant_id, username, email, password_hash, full_name, phone) VALUES 
(1, 'admin', 'admin@prashastacademy.lms.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'Prashast Admin', '+91-9876543211'),
(2, 'admin', 'admin@nabc.lms.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'NABC Admin', '+91-9876543212'),
(3, 'admin', 'admin@abcdevelopers.rupyo.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'ABC Admin', '+91-9876543213'),
(4, 'admin', 'admin@techcorp.crm.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'TechCorp Admin', '+91-9876543214');

-- 5. Create Sample Users
INSERT INTO users (
    tenant_id, username, email, password_hash, first_name, last_name,
    department, designation, employee_id, created_by
) VALUES 
-- Prashast Academy Users
(1, 'namrata.singh', 'namrata.singh@prashastacademy.lms.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'Namrata', 'Singh', 'Academic', 'Professor', 'PA001', 1),
(1, 'rajesh.kumar', 'rajesh.kumar@prashastacademy.lms.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'Rajesh', 'Kumar', 'Administration', 'Manager', 'PA002', 1),

-- NABC Institute Users
(2, 'priya.sharma', 'priya.sharma@nabc.lms.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'Priya', 'Sharma', 'IT', 'Developer', 'NABC001', 2),
(2, 'amit.patel', 'amit.patel@nabc.lms.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'Amit', 'Patel', 'Academic', 'HOD', 'NABC002', 2),

-- ABC Developers Users
(3, 'john.doe', 'john.doe@abcdevelopers.rupyo.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'John', 'Doe', 'Engineering', 'Senior Developer', 'ABC001', 3),
(3, 'sarah.wilson', 'sarah.wilson@abcdevelopers.rupyo.ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'Sarah', 'Wilson', 'HR', 'HR Manager', 'ABC002', 3);

-- 6. Create API Keys for Integration
INSERT INTO tenant_api_keys (
    tenant_id, key_name, api_key, api_secret, 
    permissions, rate_limit_per_minute, rate_limit_per_hour, created_by
) VALUES 
(1, 'LMS Integration Key', 'pa_live_key_2024_secure_random', 'pa_secret_2024_secure_random', 
 '{"send_email": true, "create_user": true, "read_user": true, "update_user": true, "delete_user": false}', 100, 2000, 1),
 
(2, 'NABC Production Key', 'nabc_live_key_2024_secure_random', 'nabc_secret_2024_secure_random',
 '{"send_email": true, "create_user": true, "read_user": true, "update_user": true, "delete_user": true}', 200, 5000, 2),
 
(3, 'Rupyo Integration', 'abc_live_key_2024_secure_random', 'abc_secret_2024_secure_random',
 '{"send_email": true, "create_user": true, "read_user": true, "update_user": false, "delete_user": false}', 50, 1000, 3);

-- 7. Create Sample Messages
INSERT INTO messages (
    user_id, tenant_id, message_id, subject, sender, recipients, 
    body_text, body_html, size_bytes, sent_at
) VALUES 
(1, 1, 'msg_001_2024', 'Welcome to SSGzone Mail', 'system@ssgzone.in', ARRAY['namrata.singh@prashastacademy.lms.ssgzone.in'],
 'Welcome to your new email system!', '<h1>Welcome to your new email system!</h1><p>Enjoy seamless communication.</p>', 1024, NOW() - INTERVAL '1 day'),
 
(2, 1, 'msg_002_2024', 'System Maintenance Notice', 'admin@prashastacademy.lms.ssgzone.in', ARRAY['rajesh.kumar@prashastacademy.lms.ssgzone.in'],
 'Scheduled maintenance on Sunday.', '<p>Scheduled maintenance on Sunday from 2 AM to 4 AM.</p>', 512, NOW() - INTERVAL '2 hours'),
 
(3, 2, 'msg_003_2024', 'Project Update', 'priya.sharma@nabc.lms.ssgzone.in', ARRAY['amit.patel@nabc.lms.ssgzone.in'],
 'Latest project status update.', '<p>Please find the latest project status update attached.</p>', 2048, NOW() - INTERVAL '30 minutes');

-- 8. Create Usage Analytics Sample Data
INSERT INTO usage_analytics (
    tenant_id, date, emails_sent, emails_received, active_users, 
    storage_used_mb, api_calls
) VALUES 
(1, CURRENT_DATE - INTERVAL '1 day', 45, 67, 12, 1024, 150),
(1, CURRENT_DATE, 23, 34, 8, 1056, 89),
(2, CURRENT_DATE - INTERVAL '1 day', 78, 92, 25, 2048, 245),
(2, CURRENT_DATE, 34, 45, 18, 2134, 167),
(3, CURRENT_DATE - INTERVAL '1 day', 12, 18, 5, 512, 67),
(3, CURRENT_DATE, 8, 12, 3, 534, 34);

-- 9. Create System Settings
INSERT INTO system_settings (key, value, description, is_public) VALUES 
('smtp_settings', '{"host": "smtp.ssgzone.in", "port": 587, "secure": true}', 'SMTP configuration for outgoing emails', false),
('max_attachment_size', '{"size_mb": 25}', 'Maximum attachment size in MB', true),
('supported_languages', '["en", "hi", "es", "fr"]', 'Supported languages for the platform', true),
('maintenance_mode', '{"enabled": false, "message": "System under maintenance"}', 'Maintenance mode settings', true);

-- 10. Create Sample Audit Logs
INSERT INTO audit_logs (
    tenant_id, user_id, action, resource, resource_id, 
    details, ip_address, user_agent, status
) VALUES 
(1, 1, 'LOGIN', 'user', '1', '{"login_method": "password"}', '192.168.1.100', 'Mozilla/5.0...', 'success'),
(1, 1, 'SEND_EMAIL', 'message', 'msg_001_2024', '{"recipient": "test@example.com"}', '192.168.1.100', 'Mozilla/5.0...', 'success'),
(2, 3, 'CREATE_USER', 'user', '4', '{"username": "new.user"}', '192.168.1.101', 'Mozilla/5.0...', 'success');