@echo off
echo ========================================
echo SSGhub Mail - Debug API Gateway
echo ========================================

echo Checking if API Gateway starts...
cd ../api-gateway
echo Current directory: %CD%
echo.
echo Trying to start API Gateway...
set PORT=4000
node src/server.js

pause