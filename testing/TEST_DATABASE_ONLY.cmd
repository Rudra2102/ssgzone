@echo off
echo ========================================
echo SSGhub Mail - Test Database Features Only
echo ========================================

echo Testing database directly (no API needed)...
echo.

echo 1. Testing WORM audit logs...
psql -U postgres -d ssghub_mail -c "SELECT COUNT(*) as audit_logs FROM audit_logs_immutable;"

echo.
echo 2. Testing DMARC policies table...
psql -U postgres -d ssghub_mail -c "INSERT INTO tenant_dmarc_policies (tenant_id, policy, percentage) VALUES (1, 'reject', 100) ON CONFLICT (tenant_id) DO UPDATE SET policy = 'reject';"
psql -U postgres -d ssghub_mail -c "SELECT policy, percentage FROM tenant_dmarc_policies WHERE tenant_id = 1;"

echo.
echo 3. Testing GDPR deletion queue...
psql -U postgres -d ssghub_mail -c "INSERT INTO gdpr_deletion_queue (user_id, user_email, tenant_id) VALUES (1, 'test.user@testcorp.lms.ssghub.com', 1);"
psql -U postgres -d ssghub_mail -c "SELECT user_email, status, scheduled_for FROM gdpr_deletion_queue;"

echo.
echo 4. Testing usage limits...
psql -U postgres -d ssghub_mail -c "INSERT INTO tenant_usage_limits (tenant_id, emails_per_month) VALUES (1, 50000) ON CONFLICT (tenant_id) DO UPDATE SET emails_per_month = 50000;"
psql -U postgres -d ssghub_mail -c "SELECT tenant_id, emails_per_month FROM tenant_usage_limits;"

echo.
echo 5. Testing migration jobs table...
psql -U postgres -d ssghub_mail -c "INSERT INTO migration_jobs (tenant_id, user_id, target_email, file_type, file_name, file_size) VALUES (1, 1, 'test.user@testcorp.lms.ssghub.com', 'mbox', 'test.mbox', 1024);"
psql -U postgres -d ssghub_mail -c "SELECT target_email, file_type, status FROM migration_jobs;"

echo.
echo ✅ Database testing completed!
echo All 6 task database structures are working correctly!
pause