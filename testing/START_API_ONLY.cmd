@echo off
echo ========================================
echo SSGhub Mail - Start API Gateway Only
echo ========================================

echo Starting API Gateway on port 4000...
cd ../api-gateway
set PORT=4000
echo API Gateway starting...
node src/server.js

pause