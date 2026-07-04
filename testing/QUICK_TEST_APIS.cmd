@echo off
echo ========================================
echo SSGhub Mail - Quick API Tests
echo ========================================

echo Testing API Gateway health...
curl -X GET http://localhost:4000/health
echo.
echo.

echo Testing WORM audit verification...
curl -X GET http://localhost:4000/api/v1/audit/verify-immutable/1 -H "Authorization: Bearer super_admin_token"
echo.
echo.

echo Testing DMARC policy set...
curl -X POST http://localhost:4000/api/v1/dmarc/policy/set -H "Content-Type: application/json" -H "Authorization: Bearer tenant_admin_token" -d "{\"policy\":\"reject\"}"
echo.
echo.

echo Testing usage metrics...
curl -X GET http://localhost:4000/api/v1/metrics/usage -H "Authorization: Bearer tenant_admin_token"
echo.
echo.

echo ✅ Quick API tests completed!
echo Check responses above for success/error messages.
pause