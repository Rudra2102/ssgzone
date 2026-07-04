@echo off
echo ========================================
echo SSGhub Mail - Install Dependencies
echo ========================================

echo Installing API Gateway dependencies...
cd ../api-gateway
npm install multer node-cron
if %errorlevel% neq 0 (
    echo ERROR: API Gateway dependencies failed
    pause
    exit /b 1
)

echo.
echo Installing Webmail Client dependencies...
cd ../webmail-client
npm install i18next react-i18next
if %errorlevel% neq 0 (
    echo ERROR: Webmail Client dependencies failed
    pause
    exit /b 1
)

echo.
echo Installing Admin Portal dependencies...
cd ../admin-portal
npm install
if %errorlevel% neq 0 (
    echo ERROR: Admin Portal dependencies failed
    pause
    exit /b 1
)

cd ../testing
echo.
echo ✅ All dependencies installed successfully!
pause