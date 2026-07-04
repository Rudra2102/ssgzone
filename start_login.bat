@echo off
cd /d "%~dp0unified-login"
if not exist node_modules (
    echo Installing dependencies...
    npm install
)
echo Starting Unified Login Portal on port 3000...
set PORT=3000
npm start