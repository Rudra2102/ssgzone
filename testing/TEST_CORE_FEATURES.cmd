@echo off
echo ========================================
echo SSGhub Mail - Test Core Features Only
echo ========================================

echo Testing API Gateway health (should be running on port 4000)...
curl -X GET http://localhost:4000/health
echo.
echo.

echo Testing WORM audit verification...
curl -X GET http://localhost:4000/api/v1/audit/verify-immutable/1 ^
  -H "Authorization: Bearer super_admin_token"
echo.
echo.

echo Testing DMARC policy set...
curl -X POST http://localhost:4000/api/v1/dmarc/policy/set ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer tenant_admin_token" ^
  -d "{\"policy\":\"reject\",\"percentage\":100}"
echo.
echo.

echo Testing GDPR deletion request...
curl -X DELETE http://localhost:4000/api/v1/user/gdpr/delete ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer api_key" ^
  -d "{\"email\":\"test.user@testcorp.lms.ssghub.com\"}"
echo.
echo.

echo Testing usage metrics...
curl -X GET http://localhost:4000/api/v1/metrics/usage ^
  -H "Authorization: Bearer tenant_admin_token"
echo.
echo.

echo ✅ Core feature tests completed!
echo If you see JSON responses above, the 6 tasks are working!
pause