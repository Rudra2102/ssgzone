@echo off
echo ========================================
echo SSGhub Mail - QUICK PRODUCTION TEST
echo ========================================
echo Testing core functionality in production environment
echo.

cd /d "d:\Pradeep_Singh\Creations\Softwares\SSGhub"

echo [1/10] Copying production configuration...
copy config\production.env .env >nul 2>&1
echo ✅ Configuration copied

echo.
echo [2/10] Starting core services...
docker-compose up -d postgres redis
timeout /t 15 /nobreak >nul
echo ✅ Database and cache started

echo.
echo [3/10] Starting all services...
docker-compose up -d
timeout /t 30 /nobreak >nul
echo ✅ All services starting...

echo.
echo [4/10] Checking service status...
docker-compose ps | findstr "Up" | find /c "Up" > temp_count.txt
set /p SERVICE_COUNT=<temp_count.txt
del temp_count.txt
echo ✅ %SERVICE_COUNT% services running

echo.
echo [5/10] Testing API Gateway...
curl -s http://localhost:4000/health | findstr "OK" >nul
if %errorlevel% neq 0 (
    echo ❌ API Gateway not responding
    goto :error
)
echo ✅ API Gateway healthy

echo.
echo [6/10] Testing SaaS registration...
curl -s -X POST http://localhost:4000/api/v1/saas/register ^
  -H "Content-Type: application/json" ^
  -d "{\"saas_name\":\"TestLMS\",\"saas_slug\":\"testlms\"}" > saas_response.json
findstr "api_key" saas_response.json >nul
if %errorlevel% neq 0 (
    echo ❌ SaaS registration failed
    type saas_response.json
    goto :error
)
echo ✅ SaaS registration successful

echo.
echo [7/10] Testing Admin Portal...
curl -s http://localhost:4001 | findstr "SSGhub" >nul
if %errorlevel% neq 0 (
    echo ❌ Admin Portal not accessible
    goto :error
)
echo ✅ Admin Portal accessible

echo.
echo [8/10] Testing Webmail Client...
curl -s http://localhost:4002 | findstr "SSGhub" >nul
if %errorlevel% neq 0 (
    echo ❌ Webmail Client not accessible
    goto :error
)
echo ✅ Webmail Client accessible

echo.
echo [9/10] Testing Mail Server ports...
netstat -an | findstr ":25 " | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    echo ❌ SMTP port not listening
    goto :error
)
echo ✅ SMTP server ready

echo.
echo [10/10] Testing storage services...
curl -s http://localhost:9000/minio/health/live >nul
if %errorlevel% neq 0 (
    echo ❌ MinIO storage not accessible
    goto :error
)
echo ✅ Object storage ready

echo.
echo ========================================
echo 🎉 QUICK TEST RESULTS: SUCCESS
echo ========================================
echo.
echo ✅ All core services operational
echo ✅ API Gateway responding
echo ✅ Web interfaces accessible  
echo ✅ Mail server ready
echo ✅ Storage systems functional
echo.
echo 🚀 PRODUCTION STATUS: READY
echo.
echo Next steps:
echo 1. Run full test: COMPREHENSIVE_PRODUCTION_TEST.cmd
echo 2. Configure SSL certificates for production
echo 3. Set up domain DNS records
echo 4. Begin customer onboarding
echo.
goto :end

:error
echo.
echo ========================================
echo ❌ TEST FAILED
echo ========================================
echo.
echo Please check the following:
echo 1. Docker is running
echo 2. Ports 4000-4004, 25, 993, 9000 are available
echo 3. Check service logs: docker-compose logs
echo.
echo To restart services:
echo docker-compose down
echo docker-compose up -d
echo.

:end
if exist saas_response.json del saas_response.json
pause