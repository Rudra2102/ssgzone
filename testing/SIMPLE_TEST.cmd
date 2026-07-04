@echo off
echo ========================================
echo SSGhub Mail - Simple Test
echo ========================================

echo Step 1: Create test data...
call CREATE_TEST_DATA.cmd

echo.
echo Step 2: Start API Gateway in background...
start "API Gateway" cmd /c "cd /d d:\Pradeep_Singh\Creations\Softwares\SSGhub\api-gateway && set PORT=4000 && node src/server.js"

echo Waiting 10 seconds for API Gateway to start...
timeout /t 10 /nobreak > nul

echo.
echo Step 3: Test core APIs...
call TEST_CORE_FEATURES.cmd

echo.
echo ✅ Simple test completed!
pause