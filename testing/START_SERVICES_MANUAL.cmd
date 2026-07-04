@echo off
echo ========================================
echo SSGhub Mail - Start Services Manually
echo ========================================

echo Starting API Gateway on port 4000...
start "API Gateway" cmd /k "cd /d d:\Pradeep_Singh\Creations\Softwares\SSGhub\api-gateway && set PORT=4000 && npm start"

timeout /t 3 /nobreak > nul

echo Starting Admin Portal on port 4001...
start "Admin Portal" cmd /k "cd /d d:\Pradeep_Singh\Creations\Softwares\SSGhub\admin-portal && set PORT=4001 && npm start"

timeout /t 3 /nobreak > nul

echo Starting Webmail Client on port 4002...
start "Webmail Client" cmd /k "cd /d d:\Pradeep_Singh\Creations\Softwares\SSGhub\webmail-client && set PORT=4002 && npm start"

echo.
echo ✅ All services starting in separate windows!
echo.
echo Services will be available at:
echo - API Gateway: http://localhost:4000
echo - Admin Portal: http://localhost:4001
echo - Webmail Client: http://localhost:4002
echo.
echo Wait 30 seconds for services to fully start, then test APIs.
pause