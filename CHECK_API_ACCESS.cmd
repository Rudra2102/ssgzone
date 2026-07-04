@echo off
echo ========================================
echo SSGzone API Access Verification
echo ========================================
echo.

echo [1/4] Checking if API Gateway is running on port 4000...
curl -s http://localhost:4000/health
if %errorlevel% neq 0 (
    echo ERROR: API Gateway is NOT running on port 4000
    echo Please start it with: docker-compose up api-gateway
    goto :end
)
echo SUCCESS: API Gateway is running
echo.

echo [2/4] Testing Super Admin Login API...
curl -X POST http://localhost:4000/api/v1/super-admin/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"superadmin\",\"password\":\"admin123\"}"
echo.
echo.

echo [3/4] Checking if Frontend is running on port 3000...
curl -s http://localhost:3000 > nul
if %errorlevel% neq 0 (
    echo WARNING: Frontend is NOT running on port 3000
    echo Please start it with: cd unified-login ^&^& npm start
) else (
    echo SUCCESS: Frontend is running
)
echo.

echo [4/4] API Endpoints Available:
echo   - Super Admin: http://localhost:4000/api/v1/super-admin
echo   - Tenant Admin: http://localhost:4000/api/v1/tenant-admin
echo   - SaaS Integration: http://localhost:4000/api/v1/saas
echo   - Communication: http://localhost:4000/api/v1/communication
echo   - Webmail: http://localhost:4000/api/v1/webmail
echo.

:end
echo ========================================
echo Verification Complete
echo ========================================
pause
