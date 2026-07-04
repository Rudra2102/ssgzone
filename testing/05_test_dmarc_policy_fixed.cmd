@echo off
echo ========================================
echo Task 1.2: DMARC Custom Policy Testing (Port 4000)
echo ========================================

echo Setting custom DMARC policy...
curl -X POST http://localhost:4000/api/v1/dmarc/policy/set ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer tenant_admin_token" ^
  -d "{\"policy\":\"reject\",\"subdomain_policy\":\"quarantine\",\"percentage\":100,\"rua_email\":\"dmarc-reports@tenant.com\",\"ruf_email\":\"dmarc-forensic@tenant.com\"}"

echo.
echo.
echo Retrieving DMARC policy...
curl -X GET http://localhost:4000/api/v1/dmarc/policy ^
  -H "Authorization: Bearer tenant_admin_token"

echo.
echo.
echo Verifying policy in database...
psql -U postgres -d ssghub_mail -c "SELECT policy, subdomain_policy, percentage FROM tenant_dmarc_policies LIMIT 1;"

echo.
echo ✅ Task 1.2 DMARC Custom Policy test completed!
pause