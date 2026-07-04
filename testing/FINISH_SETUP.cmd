@echo off
echo ========================================
echo SSGhub Mail - Finish Setup
echo ========================================

echo Installing react-scripts in webmail-client...
cd ../webmail-client
npm install react-scripts --save

echo.
echo Creating calendar service structure...
cd ..
if not exist "calendar-service" mkdir calendar-service
if not exist "calendar-service\src" mkdir calendar-service\src
if not exist "calendar-service\src\services" mkdir calendar-service\src\services

echo.
echo ✅ Setup completed!
echo.
echo Now run: SIMPLE_TEST.cmd
cd testing
pause