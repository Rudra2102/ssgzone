@echo off
echo ========================================
echo SSGhub Mail - DETAILED FEATURE TESTING
echo ========================================
echo Testing individual features in detail
echo.

:: Create test data file
echo Creating test data...
echo {
echo   "test_saas": {
echo     "saas_name": "ProductionTestLMS",
echo     "saas_slug": "prodtestlms"
echo   },
echo   "test_tenant": {
echo     "company_name": "Production Test Company",
echo     "tenant_slug": "prodtest"
echo   },
echo   "test_users": [
echo     {
echo       "username": "admin",
echo       "password": "AdminPass123!",
echo       "first_name": "Admin",
echo       "last_name": "User",
echo       "role": "admin"
echo     },
echo     {
echo       "username": "user1",
echo       "password": "UserPass123!",
echo       "first_name": "Test",
echo       "last_name": "User1",
echo       "role": "user"
echo     }
echo   ]
echo } > test_data.json

set API_URL=http://localhost:4000
set ADMIN_URL=http://localhost:4001
set WEBMAIL_URL=http://localhost:4002

echo.
echo ========================================
echo 1. SAAS APPLICATION MANAGEMENT
echo ========================================

echo Testing SaaS registration...
curl -s -X POST %API_URL%/api/v1/saas/register ^
  -H "Content-Type: application/json" ^
  -d @test_data.json | jq .api_key > api_key.txt 2>nul
if %errorlevel% neq 0 (
    echo Using fallback method for API key extraction...
    curl -s -X POST %API_URL%/api/v1/saas/register ^
      -H "Content-Type: application/json" ^
      -d "{\"saas_name\":\"ProductionTestLMS\",\"saas_slug\":\"prodtestlms\"}" > saas_response.json
    for /f "tokens=2 delims=:" %%a in ('type saas_response.json ^| findstr "api_key"') do set API_KEY=%%a
    set API_KEY=%API_KEY:"=%
    set API_KEY=%API_KEY:,=%
    set API_KEY=%API_KEY: =%
) else (
    set /p API_KEY=<api_key.txt
    set API_KEY=%API_KEY:"=%
)

echo API Key obtained: %API_KEY%

echo Testing SaaS status update...
curl -s -X PUT %API_URL%/api/v1/saas/status ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"saas_slug\":\"prodtestlms\",\"status\":\"active\"}"

echo Testing SaaS information retrieval...
curl -s -X GET %API_URL%/api/v1/saas/info ^
  -H "X-API-Key: %API_KEY%"

echo.
echo ========================================
echo 2. TENANT MANAGEMENT
echo ========================================

echo Testing tenant provisioning...
curl -s -X POST %API_URL%/api/v1/tenant/provision ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"company_name\":\"Production Test Company\",\"tenant_slug\":\"prodtest\"}" > tenant_response.json

echo Testing tenant status management...
curl -s -X PUT %API_URL%/api/v1/tenant/status ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"status\":\"active\"}"

echo Testing tenant information retrieval...
curl -s -X GET %API_URL%/api/v1/tenant/info ^
  -H "X-API-Key: %API_KEY%" ^
  -d "tenant_slug=prodtest"

echo Testing tenant list...
curl -s -X GET %API_URL%/api/v1/tenant/list ^
  -H "X-API-Key: %API_KEY%"

echo.
echo ========================================
echo 3. USER MANAGEMENT
echo ========================================

echo Testing admin user creation...
curl -s -X POST %API_URL%/api/v1/user/create ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"username\":\"admin\",\"password\":\"AdminPass123!\",\"first_name\":\"Admin\",\"last_name\":\"User\"}"

echo Testing regular user creation...
curl -s -X POST %API_URL%/api/v1/user/create ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"username\":\"user1\",\"password\":\"UserPass123!\",\"first_name\":\"Test\",\"last_name\":\"User1\"}"

echo Testing user status management...
curl -s -X PUT %API_URL%/api/v1/user/status ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"username\":\"user1\",\"status\":\"active\"}"

echo Testing user password reset...
curl -s -X POST %API_URL%/api/v1/user/reset-password ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"username\":\"user1\",\"new_password\":\"NewPass123!\"}"

echo Testing user list...
curl -s -X GET %API_URL%/api/v1/user/list ^
  -H "X-API-Key: %API_KEY%" ^
  -d "tenant_slug=prodtest"

echo.
echo ========================================
echo 4. EMAIL GROUP MANAGEMENT
echo ========================================

echo Testing group creation...
curl -s -X POST %API_URL%/api/v1/groups/create ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"group_name\":\"Sales Team\",\"group_email\":\"sales@prodtest.prodtestlms.ssghub.com\"}"

echo Testing group member addition...
curl -s -X POST %API_URL%/api/v1/groups/add-member ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"group_email\":\"sales@prodtest.prodtestlms.ssghub.com\",\"member_email\":\"user1@prodtest.prodtestlms.ssghub.com\"}"

echo Testing group list...
curl -s -X GET %API_URL%/api/v1/groups/list ^
  -H "X-API-Key: %API_KEY%" ^
  -d "tenant_slug=prodtest"

echo.
echo ========================================
echo 5. WEBMAIL FUNCTIONALITY
echo ========================================

echo Testing webmail authentication...
curl -s -X POST %API_URL%/api/v1/webmail/auth ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"user1@prodtest.prodtestlms.ssghub.com\",\"password\":\"NewPass123!\"}"

echo Testing inbox retrieval...
curl -s -X GET %API_URL%/api/v1/webmail/inbox ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"email\":\"user1@prodtest.prodtestlms.ssghub.com\"}"

echo Testing email composition...
curl -s -X POST %API_URL%/api/v1/webmail/send ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"from\":\"user1@prodtest.prodtestlms.ssghub.com\",\"to\":\"admin@prodtest.prodtestlms.ssghub.com\",\"subject\":\"Test Email\",\"body\":\"This is a test email from the production test suite.\"}"

echo.
echo ========================================
echo 6. AUTORESPONDER MANAGEMENT
echo ========================================

echo Testing autoresponder creation...
curl -s -X POST %API_URL%/api/v1/autoresponder/create ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"user_email\":\"user1@prodtest.prodtestlms.ssghub.com\",\"subject\":\"Auto Reply\",\"message\":\"Thank you for your email. I will respond shortly.\"}"

echo Testing autoresponder status...
curl -s -X PUT %API_URL%/api/v1/autoresponder/status ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"user_email\":\"user1@prodtest.prodtestlms.ssghub.com\",\"status\":\"active\"}"

echo.
echo ========================================
echo 7. WEBHOOK MANAGEMENT
echo ========================================

echo Testing webhook registration...
curl -s -X POST %API_URL%/api/v1/webhooks/register ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"url\":\"https://prodtest.example.com/webhook\",\"events\":[\"email.sent\",\"email.received\",\"user.created\"]}"

echo Testing webhook list...
curl -s -X GET %API_URL%/api/v1/webhooks/list ^
  -H "X-API-Key: %API_KEY%" ^
  -d "tenant_slug=prodtest"

echo Testing webhook test...
curl -s -X POST %API_URL%/api/v1/webhooks/test ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"webhook_id\":1}"

echo.
echo ========================================
echo 8. SEARCH FUNCTIONALITY
echo ========================================

echo Testing email search...
curl -s -X POST %API_URL%/api/v1/search/emails ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"query\":\"test\",\"user_email\":\"user1@prodtest.prodtestlms.ssghub.com\"}"

echo Testing advanced search...
curl -s -X POST %API_URL%/api/v1/search/advanced ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"from\":\"admin@prodtest.prodtestlms.ssghub.com\",\"subject\":\"Test\",\"date_range\":{\"start\":\"2024-01-01\",\"end\":\"2024-12-31\"}}"

echo.
echo ========================================
echo 9. ATTACHMENT MANAGEMENT
echo ========================================

echo Creating test attachment...
echo This is a test attachment file for production testing. > test_attachment.txt

echo Testing attachment upload...
curl -s -X POST %API_URL%/api/v1/attachments/upload ^
  -H "X-API-Key: %API_KEY%" ^
  -F "file=@test_attachment.txt" ^
  -F "tenant_slug=prodtest" ^
  -F "user_email=user1@prodtest.prodtestlms.ssghub.com"

echo Testing attachment list...
curl -s -X GET %API_URL%/api/v1/attachments/list ^
  -H "X-API-Key: %API_KEY%" ^
  -d "tenant_slug=prodtest&user_email=user1@prodtest.prodtestlms.ssghub.com"

del test_attachment.txt

echo.
echo ========================================
echo 10. SIGNATURE MANAGEMENT
echo ========================================

echo Testing signature creation...
curl -s -X POST %API_URL%/api/v1/signatures/tenant/signature ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"signature_html\":\"<div><p><strong>Production Test Company</strong></p><p>Email: contact@prodtest.prodtestlms.ssghub.com</p><p>Phone: +1-555-0123</p></div>\"}"

echo Testing signature retrieval...
curl -s -X GET %API_URL%/api/v1/signatures/tenant/signature ^
  -H "X-API-Key: %API_KEY%" ^
  -d "tenant_slug=prodtest"

echo Testing user signature override...
curl -s -X POST %API_URL%/api/v1/signatures/user/signature ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"user_email\":\"user1@prodtest.prodtestlms.ssghub.com\",\"signature_html\":\"<p>Best regards,<br>Test User1</p>\"}"

echo.
echo ========================================
echo 11. DATA RETENTION MANAGEMENT
echo ========================================

echo Testing retention policy creation...
curl -s -X POST %API_URL%/api/v1/retention/policy ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"retention_days\":2555,\"archive_days\":365,\"auto_delete\":false}"

echo Testing retention policy retrieval...
curl -s -X GET %API_URL%/api/v1/retention/policy ^
  -H "X-API-Key: %API_KEY%" ^
  -d "tenant_slug=prodtest"

echo.
echo ========================================
echo 12. METRICS AND ANALYTICS
echo ========================================

echo Testing tenant metrics...
curl -s -X GET %API_URL%/api/v1/metrics/tenant/prodtest ^
  -H "X-API-Key: %API_KEY%"

echo Testing usage analytics...
curl -s -X GET %API_URL%/api/v1/metrics/usage ^
  -H "X-API-Key: %API_KEY%" ^
  -d "tenant_slug=prodtest&start_date=2024-01-01&end_date=2024-12-31"

echo Testing performance metrics...
curl -s -X GET %API_URL%/api/v1/metrics/performance ^
  -H "X-API-Key: %API_KEY%"

echo.
echo ========================================
echo 13. AUDIT AND COMPLIANCE
echo ========================================

echo Testing audit log retrieval...
curl -s -X GET %API_URL%/api/v1/audit/logs ^
  -H "X-API-Key: %API_KEY%" ^
  -d "tenant_slug=prodtest&limit=50"

echo Testing compliance export...
curl -s -X POST %API_URL%/api/v1/audit/export ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"start_date\":\"2024-01-01\",\"end_date\":\"2024-12-31\",\"format\":\"json\"}"

echo.
echo ========================================
echo 14. DMARC REPORTING
echo ========================================

echo Testing DMARC report submission...
curl -s -X POST %API_URL%/api/v1/dmarc/report ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"domain\":\"prodtest.prodtestlms.ssghub.com\",\"report_data\":\"<?xml version='1.0'?><feedback><report_metadata><org_name>Test</org_name></report_metadata></feedback>\"}"

echo Testing DMARC reports retrieval...
curl -s -X GET %API_URL%/api/v1/dmarc/reports ^
  -H "X-API-Key: %API_KEY%" ^
  -d "domain=prodtest.prodtestlms.ssghub.com"

echo Testing DMARC policy configuration...
curl -s -X POST %API_URL%/api/v1/dmarc/policy ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"domain\":\"prodtest.prodtestlms.ssghub.com\",\"policy\":\"quarantine\",\"percentage\":100}"

echo.
echo ========================================
echo 15. CALENDAR AND EXPORT SERVICES
echo ========================================

echo Testing calendar data export...
curl -s -X GET %API_URL%/api/v1/export/tenant/data ^
  -H "X-API-Key: %API_KEY%" ^
  -d "tenant_slug=prodtest&format=ical"

echo Testing contact export...
curl -s -X GET %API_URL%/api/v1/export/tenant/contacts ^
  -H "X-API-Key: %API_KEY%" ^
  -d "tenant_slug=prodtest&format=vcard"

echo Testing bulk data export...
curl -s -X POST %API_URL%/api/v1/export/bulk ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"include\":[\"emails\",\"contacts\",\"calendar\"],\"format\":\"zip\"}"

echo.
echo ========================================
echo 16. MIGRATION TOOLS
echo ========================================

echo Testing migration validation...
curl -s -X POST %API_URL%/api/v1/migration/validate ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"prodtest\",\"source_type\":\"mbox\",\"source_path\":\"/tmp/test.mbox\"}"

echo Testing migration status...
curl -s -X GET %API_URL%/api/v1/migration/status ^
  -H "X-API-Key: %API_KEY%" ^
  -d "tenant_slug=prodtest"

echo.
echo ========================================
echo 17. IP WARMUP SERVICE
echo ========================================

echo Testing IP initialization...
curl -s -X POST http://localhost:4004/warmup/initialize/192.168.1.100

echo Testing IP warmup status...
curl -s -X GET http://localhost:4004/warmup/status/192.168.1.100

echo Testing sending limit check...
curl -s -X GET http://localhost:4004/warmup/check/192.168.1.100

echo Testing email sent recording...
curl -s -X POST http://localhost:4004/warmup/record/192.168.1.100

echo.
echo ========================================
echo 18. OAUTH INTEGRATION
echo ========================================

echo Testing OAuth authorization...
curl -s -X GET %API_URL%/api/v1/oauth/authorize ^
  -H "X-API-Key: %API_KEY%" ^
  -d "client_id=test_client&response_type=code&redirect_uri=https://example.com/callback"

echo Testing OAuth token exchange...
curl -s -X POST %API_URL%/api/v1/oauth/token ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"grant_type\":\"authorization_code\",\"code\":\"test_code\",\"client_id\":\"test_client\",\"client_secret\":\"test_secret\"}"

echo.
echo ========================================
echo CLEANUP TEST DATA
echo ========================================

echo Cleaning up test files...
if exist "test_data.json" del test_data.json
if exist "api_key.txt" del api_key.txt
if exist "saas_response.json" del saas_response.json
if exist "tenant_response.json" del tenant_response.json

echo.
echo ========================================
echo DETAILED FEATURE TEST COMPLETED
echo ========================================
echo.
echo All individual features have been tested
echo Check the responses above for any errors
echo If all responses show success/data, all features are working
echo.
pause