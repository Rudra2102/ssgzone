@echo off
echo ========================================
echo Task 2.1: Usage-Based Rate Limiting Testing
echo ========================================

echo Setting up test usage limits...
psql -U postgres -d ssghub_mail -c "INSERT INTO tenant_usage_limits (tenant_id, emails_per_month, api_calls_per_minute) VALUES (1, 100, 10) ON CONFLICT (tenant_id) DO UPDATE SET emails_per_month = 100, api_calls_per_minute = 10;"

echo.
echo Testing API rate limits (making 20 rapid requests)...
for /L %%i in (1,1,20) do (
    curl -X GET http://localhost:3005/api/v1/metrics/usage ^
      -H "Authorization: Bearer tenant_admin_token" ^
      -w "%%{http_code} " -o nul -s
)

echo.
echo.
echo Checking usage metrics...
curl -X GET http://localhost:3005/api/v1/metrics/usage ^
  -H "Authorization: Bearer tenant_admin_token"

echo.
echo.
echo Verifying usage tracking in database...
psql -U postgres -d ssghub_mail -c "SELECT tenant_id, month_year, emails_sent, api_calls_made FROM tenant_usage_tracking;"

echo.
echo ✅ Task 2.1 Usage-Based Rate Limiting test completed!
pause