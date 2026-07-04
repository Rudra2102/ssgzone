@echo off
echo ========================================
echo Renaming SSGhub to SSGzone in all files
echo ========================================
echo.

echo This will update:
echo - Database names: ssghub_mail to ssgzone_mail
echo - Database users: ssghub to ssgzone
echo - Bucket names: ssghub-attachments to ssgzone-attachments
echo - Python packages: ssghub_mail to ssgzone_mail
echo - All text references: SSGhub to SSGzone
echo.

pause

echo.
echo Starting rename process...
echo.

REM Update .env files
echo Updating .env files...
powershell -Command "(Get-Content .env) -replace 'ssghub_mail', 'ssgzone_mail' -replace 'ssghub', 'ssgzone' | Set-Content .env"
powershell -Command "(Get-Content .env.example) -replace 'ssghub_mail', 'ssgzone_mail' -replace 'ssghub', 'ssgzone' | Set-Content .env.example"

REM Update config files
echo Updating config files...
powershell -Command "(Get-Content config\production.env) -replace 'ssghub_mail', 'ssgzone_mail' -replace 'ssghub', 'ssgzone' | Set-Content config\production.env"
powershell -Command "(Get-Content config\production-optimized.env) -replace 'ssghub_mail', 'ssgzone_mail' -replace 'ssghub', 'ssgzone' | Set-Content config\production-optimized.env"

REM Update docker-compose files
echo Updating docker-compose files...
powershell -Command "(Get-Content docker-compose.yml) -replace 'ssghub_mail', 'ssgzone_mail' -replace 'ssghub', 'ssgzone' | Set-Content docker-compose.yml"
powershell -Command "(Get-Content docker-compose.production.yml) -replace 'ssghub_mail', 'ssgzone_mail' -replace 'ssghub', 'ssgzone' | Set-Content docker-compose.production.yml"

REM Update database files
echo Updating database files...
powershell -Command "(Get-Content database\init\01_schema.sql) -replace 'ssghub', 'ssgzone' | Set-Content database\init\01_schema.sql"

REM Update API Gateway utils
echo Updating API Gateway files...
powershell -Command "(Get-Content api-gateway\src\utils\database.js) -replace 'ssghub_mail', 'ssgzone_mail' -replace 'ssghub', 'ssgzone' | Set-Content api-gateway\src\utils\database.js"

REM Update SDK files
echo Updating SDK files...
powershell -Command "(Get-Content sdks\nodejs\package.json) -replace 'ssghub', 'ssgzone' -replace 'SSGhub', 'SSGzone' | Set-Content sdks\nodejs\package.json"
powershell -Command "(Get-Content sdks\nodejs\index.js) -replace 'ssghub', 'ssgzone' -replace 'SSGhub', 'SSGzone' | Set-Content sdks\nodejs\index.js"
powershell -Command "(Get-Content sdks\nodejs\ssghub-mail-sdk.js) -replace 'SSGhub', 'SSGzone' | Set-Content sdks\nodejs\ssgzone-mail-sdk.js"
del sdks\nodejs\ssghub-mail-sdk.js

powershell -Command "(Get-Content sdks\python\setup.py) -replace 'ssghub', 'ssgzone' -replace 'SSGhub', 'SSGzone' | Set-Content sdks\python\setup.py"
powershell -Command "(Get-Content sdks\python\ssghub_mail\__init__.py) -replace 'ssghub', 'ssgzone' -replace 'SSGhub', 'SSGzone' | Set-Content sdks\python\ssgzone_mail\__init__.py"
move sdks\python\ssghub_mail sdks\python\ssgzone_mail 2>nul

REM Update documentation
echo Updating documentation files...
powershell -Command "(Get-Content INTEGRATION_GUIDE.md) -replace 'SSGhub', 'SSGzone' -replace 'ssghub', 'ssgzone' | Set-Content INTEGRATION_GUIDE.md"
powershell -Command "(Get-Content DIGITALOCEAN_SETUP_GUIDE.md) -replace 'SSGhub', 'SSGzone' -replace 'ssghub', 'ssgzone' | Set-Content DIGITALOCEAN_SETUP_GUIDE.md"
powershell -Command "(Get-Content QUICK_DIGITALOCEAN_CHECKLIST.md) -replace 'SSGhub', 'SSGzone' -replace 'ssghub', 'ssgzone' | Set-Content QUICK_DIGITALOCEAN_CHECKLIST.md"
powershell -Command "(Get-Content FIRST_TIME_HOSTING_GUIDE.md) -replace 'SSGhub', 'SSGzone' -replace 'ssghub', 'ssgzone' | Set-Content FIRST_TIME_HOSTING_GUIDE.md"

REM Update admin portal
echo Updating admin portal files...
powershell -Command "(Get-Content admin-portal\public\index.html) -replace 'SSGhub', 'SSGzone' | Set-Content admin-portal\public\index.html"
powershell -Command "(Get-Content admin-portal\src\App.js) -replace 'SSGhub', 'SSGzone' | Set-Content admin-portal\src\App.js"

REM Update webmail client
echo Updating webmail client files...
powershell -Command "(Get-Content webmail-client\public\index.html) -replace 'SSGhub', 'SSGzone' | Set-Content webmail-client\public\index.html"
powershell -Command "(Get-Content webmail-client\src\App.js) -replace 'SSGhub', 'SSGzone' | Set-Content webmail-client\src\App.js"

echo.
echo ========================================
echo Rename completed successfully!
echo ========================================
echo.
echo Updated:
echo - Database: ssgzone_mail
echo - User: ssgzone
echo - Bucket: ssgzone-attachments
echo - All references: SSGzone
echo.
echo IMPORTANT: Restart Docker containers after this change
echo Run: docker-compose down
echo Run: docker-compose up -d
echo.
pause