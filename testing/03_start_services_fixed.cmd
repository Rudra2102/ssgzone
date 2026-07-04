@echo off
echo ========================================
echo SSGhub Mail - Start Services (Port 4000 Series)
echo ========================================

echo Starting API Gateway on port 4000...
start "API Gateway" cmd /k "cd ../api-gateway && set PORT=4000 && npm start"

timeout /t 5 /nobreak > nul

echo Starting Admin Portal on port 4001...
start "Admin Portal" cmd /k "cd ../admin-portal && set PORT=4001 && npm start"

timeout /t 5 /nobreak > nul

echo Starting Webmail Client on port 4002...
start "Webmail Client" cmd /k "cd ../webmail-client && set PORT=4002 && npm start"

echo.
echo ✅ All services started!
echo.
echo Services running:
echo - API Gateway: http://localhost:4000
echo - Admin Portal: http://localhost:4001
echo - Webmail Client: http://localhost:4002
echo.
echo Wait 30 seconds for all services to fully start, then run next test.
pause