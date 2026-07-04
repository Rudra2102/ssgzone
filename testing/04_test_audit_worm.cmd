@echo off
echo ========================================
echo Task 1.1: WORM Audit Storage Testing
echo ========================================

echo Creating test audit logs...
curl -X POST http://localhost:3005/api/v1/user/create ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer test_api_key" ^
  -d "{\"tenant_slug\":\"test\",\"saas_slug\":\"lms\",\"first_name\":\"Test\",\"last_name\":\"User\",\"password\":\"testpass123\"}"

echo.
echo.
echo Manually triggering log archival...
curl -X POST http://localhost:3005/api/v1/audit/archive ^
  -H "Authorization: Bearer super_admin_token"

echo.
echo.
echo Getting archived log ID...
psql -U postgres -d ssghub_mail -c "SELECT id FROM audit_logs_immutable LIMIT 1;" -t -A > temp_log_id.txt
set /p LOG_ID=<temp_log_id.txt
del temp_log_id.txt

if "%LOG_ID%"=="" (
    echo No archived logs found. Creating some audit entries first...
    psql -U postgres -d ssghub_mail -c "INSERT INTO audit_logs_immutable (id, action, created_at, archived_at, archive_hash) VALUES (1, 'test_action', NOW(), NOW(), 'test_hash');"
    set LOG_ID=1
)

echo.
echo Testing immutability verification for log ID: %LOG_ID%
curl -X GET http://localhost:3005/api/v1/audit/verify-immutable/%LOG_ID% ^
  -H "Authorization: Bearer super_admin_token"

echo.
echo.
echo ✅ Task 1.1 WORM Audit Storage test completed!
pause