@echo off
cd /d "%~dp0super-admin-portal"
if not exist node_modules (
    echo Installing dependencies...
    npm install
)
echo Starting Super Admin Portal on port 3001...
set PORT=3001
npm start