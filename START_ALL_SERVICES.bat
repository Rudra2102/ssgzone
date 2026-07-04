@echo off
title SSGzone Mail Platform - Master Startup
color 0A

echo ========================================
echo    SSGzone Mail Platform v2.0
echo    Master Startup Script
echo ========================================
echo.

echo [1/6] Starting Docker Services...
docker-compose up -d
timeout /t 5 /nobreak >nul

echo [2/6] Installing Dependencies...
cd /d "%~dp0unified-login"
if not exist node_modules npm install
cd /d "%~dp0"

echo [3/6] Starting Unified Login Portal (Port 3000)...
start "SSGzone Login" cmd /k "cd /d "%~dp0unified-login" && set PORT=3000 && npm start"
timeout /t 10 /nobreak >nul

echo [4/6] Opening Unified Login Portal...
start http://localhost:3000

echo.
echo ========================================
echo    All Services Started Successfully!
echo ========================================
echo.
echo Access everything through Unified Login:
echo - Unified Login:      http://localhost:3000
echo.
echo Backend Services:
echo - API Gateway:        http://localhost:4000
echo - User Webmail:       http://localhost:4002
echo.
echo Development Access (if needed):
echo - Super Admin:        http://localhost:3001
echo - Tenant Admin:       http://localhost:3003
echo.
echo Press any key to exit...
pause >nul