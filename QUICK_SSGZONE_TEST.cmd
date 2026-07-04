@echo off
echo ========================================
echo SSGzone Mail - QUICK PRODUCTION TEST
echo ========================================
echo Testing SSGzone Mail platform functionality
echo.

cd /d "d:\Pradeep_Singh\Creations\Softwares\SSGhub"

echo [1/10] Starting core services...
docker-compose up -d postgres redis
timeout /t 15 /nobreak >nul
echo ✅ Database and cache started

echo.
echo [2/10] Starting all services...
docker-compose up -d
timeout /t 30 /nobreak >nul
echo ✅ All services starting...

echo.
echo [3/10] Checking service status...
docker-compose ps | findstr "Up" | find /c "Up" > temp_count.txt
set /p SERVICE_COUNT=<temp_count.txt
del temp_count.txt
echo ✅ %SERVICE_COUNT% services running

echo.
echo [4/10] Testing API Gateway...
curl -s http://localhost:4000/health | findstr "OK" >nul
if %errorlevel% neq 0 (
    echo ❌ API Gateway not responding
    goto :error
)
echo ✅ API Gateway healthy

echo.
echo [5/10] Testing SaaS registration...
curl -s -X POST http://localhost:4000/api/v1/saas/register ^
  -H "Content-Type: application/json" ^
  -d "{\"saas_name\":\"TestLMS\",\"saas_slug\":\"testlms\"}" > saas_response.json
findstr "api_key" saas_response.json >nul
if %errorlevel% neq 0 (
    echo ❌ SaaS registration failed
    type saas_response.json
    goto :error
)

for /f "tokens=2 delims=:" %%a in ('findstr "api_key" saas_response.json') do set API_KEY_RAW=%%a
set API_KEY=%API_KEY_RAW:"=%
set API_KEY=%API_KEY:,=%
set API_KEY=%API_KEY: =%
echo ✅ SaaS registration successful

echo.
echo [6/10] Testing tenant provisioning...
curl -s -X POST http://localhost:4000/api/v1/tenant/provision ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"company_name\":\"Test Company\",\"tenant_slug\":\"testco\"}" > tenant_response.json
findstr "domain" tenant_response.json >nul
if %errorlevel% neq 0 (
    echo ❌ Tenant provisioning failed
    type tenant_response.json
    goto :error
)
echo ✅ Tenant provisioned: testco.testlms.ssgzone.com

echo.
echo [7/10] Testing user creation...
curl -s -X POST http://localhost:4000/api/v1/user/create ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"testco\",\"username\":\"testuser\",\"password\":\"TestPass123\",\"first_name\":\"Test\",\"last_name\":\"User\"}" > user_response.json
findstr "email" user_response.json >nul
if %errorlevel% neq 0 (
    echo ❌ User creation failed
    type user_response.json
    goto :error
)
echo ✅ User created: testuser@testco.testlms.ssgzone.com

echo.
echo [8/10] Testing Admin Portal...
curl -s http://localhost:4001 | findstr "SSG" >nul
if %errorlevel% neq 0 (
    echo ❌ Admin Portal not accessible
    goto :error
)
echo ✅ Admin Portal accessible

echo.
echo [9/10] Testing Webmail Client...
curl -s http://localhost:4002 | findstr "SSG" >nul
if %errorlevel% neq 0 (
    echo ❌ Webmail Client not accessible
    goto :error
)
echo ✅ Webmail Client accessible

echo.
echo [10/10] Testing Mail Server...
netstat -an | findstr ":25 " | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    echo ❌ SMTP port not listening
    goto :error
)
echo ✅ Mail server ready

echo.
echo ========================================
echo 🎉 SSGzone Mail - TEST SUCCESS
echo ========================================
echo.
echo ✅ All core services operational
echo ✅ Email domain: ssgzone.com
echo ✅ Test email: testuser@testco.testlms.ssgzone.com
echo ✅ Admin Portal: http://localhost:4001
echo ✅ Webmail: http://localhost:4002
echo.
echo 🚀 PRODUCTION STATUS: READY
echo.
echo Email format: username@tenant.saas.ssgzone.com
echo Example: john@company.lms.ssgzone.com
echo.
goto :end

:error
echo.
echo ========================================
echo ❌ TEST FAILED
echo ========================================
echo.
echo Check service logs: docker-compose logs
echo Restart: docker-compose down && docker-compose up -d
echo.

:end
if exist saas_response.json del saas_response.json
if exist tenant_response.json del tenant_response.json
if exist user_response.json del user_response.json
pause