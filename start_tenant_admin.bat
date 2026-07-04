@echo off
cd /d "%~dp0tenant-admin-portal"
if not exist node_modules (
    echo Installing dependencies...
    npm install
)
echo Starting Tenant Admin Portal on port 3003...
set PORT=3003
npm start