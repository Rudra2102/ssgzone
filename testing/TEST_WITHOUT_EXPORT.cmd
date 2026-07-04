@echo off
echo ========================================
echo SSGhub Mail - Test Without Export Route
echo ========================================

echo Temporarily disabling export route to test core features...
cd ../api-gateway/src

echo Creating backup of server.js...
copy server.js server.js.backup >nul

echo Commenting out export route...
powershell -Command "(Get-Content server.js) -replace 'const exportRoutes = require.*', '// const exportRoutes = require...' | Set-Content server.js"
powershell -Command "(Get-Content server.js) -replace 'app.use.*exportRoutes.*', '// app.use exportRoutes...' | Set-Content server.js"

echo.
echo Starting API Gateway without export route...
set PORT=4000
start "API Gateway" cmd /k "node server.js"

echo.
echo Waiting 5 seconds for startup...
timeout /t 5 /nobreak > nul

echo.
echo Testing core APIs...
cd ../../testing
curl -X GET http://localhost:4000/health
echo.
echo.

echo Testing WORM audit...
curl -X GET http://localhost:4000/api/v1/audit/verify-immutable/1 -H "Authorization: Bearer super_admin_token"
echo.
echo.

echo ✅ Core API test completed!
echo.
echo Restoring server.js...
cd ../api-gateway/src
copy server.js.backup server.js >nul
del server.js.backup >nul

cd ../../testing
pause