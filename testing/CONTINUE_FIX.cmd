@echo off
echo ========================================
echo SSGhub Mail - Continue Fix Process
echo ========================================

echo Installing react-scripts in admin-portal...
cd ../admin-portal
npm install react-scripts --save

echo.
echo Installing react-scripts in webmail-client...
cd ../webmail-client
npm install react-scripts --save

echo.
echo Creating missing calendar service directory...
cd ..
if not exist "calendar-service\src\services" mkdir calendar-service\src\services

echo.
echo ✅ All fixes completed!
cd testing
pause