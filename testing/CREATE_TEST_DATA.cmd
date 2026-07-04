@echo off
echo ========================================
echo SSGhub Mail - Create Test Data
echo ========================================

echo Creating test SaaS application...
psql -U postgres -d ssghub_mail -c "INSERT INTO saas_applications (saas_name, saas_slug, api_key, status) VALUES ('Test LMS', 'lms', 'test_api_key_hash', 'active') ON CONFLICT (saas_slug) DO NOTHING;"

echo.
echo Creating test tenant...
psql -U postgres -d ssghub_mail -c "INSERT INTO tenants (saas_id, company_name, tenant_slug, domain, status) VALUES (1, 'Test Company', 'testcorp', 'testcorp.lms.ssghub.com', 'active') ON CONFLICT (saas_id, tenant_slug) DO NOTHING;"

echo.
echo Creating test user...
psql -U postgres -d ssghub_mail -c "INSERT INTO users (tenant_id, username, email, password_hash, first_name, last_name, status) VALUES (1, 'test.user', 'test.user@testcorp.lms.ssghub.com', 'hashed_password', 'Test', 'User', 'active') ON CONFLICT (email) DO NOTHING;"

echo.
echo Verifying test data...
psql -U postgres -d ssghub_mail -c "SELECT s.saas_name, t.company_name, u.email FROM saas_applications s JOIN tenants t ON s.id = t.saas_id JOIN users u ON t.id = u.tenant_id;"

echo.
echo ✅ Test data created successfully!
pause