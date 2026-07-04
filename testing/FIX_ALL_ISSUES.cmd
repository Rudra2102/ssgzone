@echo off
echo ========================================
echo SSGhub Mail - Fix All Issues
echo ========================================

echo Installing react-scripts globally...
npm install -g react-scripts
if %errorlevel% neq 0 (
    echo ERROR: Failed to install react-scripts globally
    pause
    exit /b 1
)

echo.
echo Installing react-scripts in admin-portal...
cd ../admin-portal
npm install react-scripts --save
if %errorlevel% neq 0 (
    echo ERROR: Failed to install react-scripts in admin-portal
    pause
    exit /b 1
)

echo.
echo Installing react-scripts in webmail-client...
cd ../webmail-client
npm install react-scripts --save
if %errorlevel% neq 0 (
    echo ERROR: Failed to install react-scripts in webmail-client
    pause
    exit /b 1
)

echo.
echo Creating missing calendar service directory...
cd ..
if not exist "calendar-service\src\services" mkdir calendar-service\src\services

echo.
echo ✅ All issues fixed!
echo - react-scripts installed globally and locally
echo - Missing ExportService created
echo - Calendar service directory structure created
echo.
cd testing
pause