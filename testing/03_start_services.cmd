@echo off
echo ========================================
echo SSGhub Mail - Start Services
echo ========================================

echo Starting API Gateway on port 3005...
start "API Gateway" cmd /k "cd ../api-gateway && npm start"

timeout /t 5 /nobreak > nul

echo Starting Admin Portal on port 3001...
start "Admin Portal" cmd /k "cd ../admin-portal && npm start"

timeout /t 5 /nobreak > nul

echo Starting Webmail Client on port 3002...
start "Webmail Client" cmd /k "cd ../webmail-client && npm start"

echo.
echo ✅ All services started!
echo.
echo Services running:
echo - API Gateway: http://localhost:3005
echo - Admin Portal: http://localhost:3001
echo - Webmail Client: http://localhost:3002
echo.
echo Wait 30 seconds for all services to fully start, then run next test.
pause