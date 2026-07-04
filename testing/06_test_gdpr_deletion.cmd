@echo off
echo ========================================
echo Task 1.3: GDPR Right to Be Forgotten Testing
echo ========================================

echo Requesting GDPR deletion...
curl -X DELETE http://localhost:3005/api/v1/user/gdpr/delete ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer api_key" ^
  -d "{\"email\":\"test.user@tenant.lms.ssghub.com\"}"

echo.
echo.
echo Checking deletion status...
curl -X GET http://localhost:3005/api/v1/user/gdpr/status/test.user@tenant.lms.ssghub.com ^
  -H "Authorization: Bearer api_key"

echo.
echo.
echo Verifying queue entry in database...
psql -U postgres -d ssghub_mail -c "SELECT user_email, status, scheduled_for FROM gdpr_deletion_queue WHERE status = 'pending';"

echo.
echo.
echo Testing duplicate request (should fail)...
curl -X DELETE http://localhost:3005/api/v1/user/gdpr/delete ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer api_key" ^
  -d "{\"email\":\"test.user@tenant.lms.ssghub.com\"}"

echo.
echo ✅ Task 1.3 GDPR Right to Be Forgotten test completed!
pause