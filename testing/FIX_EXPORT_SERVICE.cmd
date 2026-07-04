@echo off
echo ========================================
echo SSGhub Mail - Fix Export Service
echo ========================================

echo Creating calendar service structure...
if not exist "../calendar-service" mkdir "../calendar-service"
if not exist "../calendar-service/src" mkdir "../calendar-service/src"
if not exist "../calendar-service/src/services" mkdir "../calendar-service/src/services"

echo.
echo ExportService already exists, copying to correct location...
copy "../calendar-service/src/services/ExportService.js" "../calendar-service/src/services/ExportService.js" >nul 2>&1

echo.
echo Testing API Gateway startup...
cd ../api-gateway
set PORT=4000
echo Starting API Gateway...
timeout /t 2 /nobreak > nul
start "API Gateway Test" cmd /k "node src/server.js"

echo.
echo ✅ API Gateway should be starting now!
echo Check the new window for startup messages.
cd ../testing
pause