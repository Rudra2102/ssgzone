@echo off
REM SSGzone Migration Fix Script
REM This script fixes all remaining SSGhub references

echo.
echo ========================================
echo SSGzone Migration Fix Script
echo ========================================
echo.

REM Fix 1: Rename Python SDK folder
echo [1/10] Renaming Python SDK folder...
if exist "sdks\python\ssghub_mail" (
    ren "sdks\python\ssghub_mail" "ssgzone_mail"
    echo ✓ Python SDK folder renamed
) else (
    echo ✗ Python SDK folder not found or already renamed
)

REM Fix 2: Update Python SDK __init__.py
echo [2/10] Updating Python SDK __init__.py...
if exist "sdks\python\ssgzone_mail\__init__.py" (
    powershell -Command "(Get-Content 'sdks\python\ssgzone_mail\__init__.py') -replace 'SSGHubClient', 'SSGzoneMailClient' | Set-Content 'sdks\python\ssgzone_mail\__init__.py'"
    echo ✓ Python SDK class name updated
) else (
    echo ✗ Python SDK __init__.py not found
)

REM Fix 3: Update Python SDK setup.py
echo [3/10] Updating Python SDK setup.py...
if exist "sdks\python\setup.py" (
    powershell -Command "(Get-Content 'sdks\python\setup.py') -replace 'ssghub-mail-sdk', 'ssgzone-mail-sdk' | Set-Content 'sdks\python\setup.py'"
    powershell -Command "(Get-Content 'sdks\python\setup.py') -replace 'SSGhub Mail Platform', 'SSGzone Mail Platform' | Set-Content 'sdks\python\setup.py'"
    powershell -Command "(Get-Content 'sdks\python\setup.py') -replace 'SSGhub Team', 'SSGzone Team' | Set-Content 'sdks\python\setup.py'"
    powershell -Command "(Get-Content 'sdks\python\setup.py') -replace 'support@ssghub.com', 'support@ssgzone.in' | Set-Content 'sdks\python\setup.py'"
    powershell -Command "(Get-Content 'sdks\python\setup.py') -replace 'github.com/ssghub', 'github.com/ssgzone' | Set-Content 'sdks\python\setup.py'"
    echo ✓ Python SDK setup.py updated
) else (
    echo ✗ Python SDK setup.py not found
)

REM Fix 4: Update README.md
echo [4/10] Updating README.md...
if exist "README.md" (
    powershell -Command "(Get-Content 'README.md') -replace 'SSGhub Mail', 'SSGzone Mail' | Set-Content 'README.md'"
    echo ✓ README.md updated
) else (
    echo ✗ README.md not found
)

REM Fix 5: Update API Gateway package.json
echo [5/10] Updating API Gateway package.json...
if exist "api-gateway\package.json" (
    powershell -Command "(Get-Content 'api-gateway\package.json') -replace 'ssghub-api-gateway', 'ssgzone-api-gateway' | Set-Content 'api-gateway\package.json'"
    powershell -Command "(Get-Content 'api-gateway\package.json') -replace 'SSGhub Mail Service', 'SSGzone Mail Service' | Set-Content 'api-gateway\package.json'"
    echo ✓ API Gateway package.json updated
) else (
    echo ✗ API Gateway package.json not found
)

REM Fix 6: Update Admin Portal package.json
echo [6/10] Updating Admin Portal package.json...
if exist "admin-portal\package.json" (
    powershell -Command "(Get-Content 'admin-portal\package.json') -replace 'ssghub-admin-portal', 'ssgzone-admin-portal' | Set-Content 'admin-portal\package.json'"
    echo ✓ Admin Portal package.json updated
) else (
    echo ✗ Admin Portal package.json not found
)

REM Fix 7: Update Webmail Client package.json
echo [7/10] Updating Webmail Client package.json...
if exist "webmail-client\package.json" (
    powershell -Command "(Get-Content 'webmail-client\package.json') -replace 'ssghub-webmail-client', 'ssgzone-webmail-client' | Set-Content 'webmail-client\package.json'"
    echo ✓ Webmail Client package.json updated
) else (
    echo ✗ Webmail Client package.json not found
)

REM Fix 8: Update Mail Server package.json
echo [8/10] Updating Mail Server package.json...
if exist "mail-server\package.json" (
    powershell -Command "(Get-Content 'mail-server\package.json') -replace 'ssghub-mail-server', 'ssgzone-mail-server' | Set-Content 'mail-server\package.json'"
    powershell -Command "(Get-Content 'mail-server\package.json') -replace 'SSGhub Mail Service', 'SSGzone Mail Service' | Set-Content 'mail-server\package.json'"
    echo ✓ Mail Server package.json updated
) else (
    echo ✗ Mail Server package.json not found
)

REM Fix 9: Update API Gateway server.js
echo [9/10] Updating API Gateway server.js...
if exist "api-gateway\src\server.js" (
    powershell -Command "(Get-Content 'api-gateway\src\server.js') -replace 'SSGhub API Gateway', 'SSGzone API Gateway' | Set-Content 'api-gateway\src\server.js'"
    echo ✓ API Gateway server.js updated
) else (
    echo ✗ API Gateway server.js not found
)

REM Fix 10: Update Mail Server server.js
echo [10/10] Updating Mail Server server.js...
if exist "mail-server\src\server.js" (
    powershell -Command "(Get-Content 'mail-server\src\server.js') -replace 'SSGhub', 'SSGzone' | Set-Content 'mail-server\src\server.js'"
    echo ✓ Mail Server server.js updated
) else (
    echo ✗ Mail Server server.js not found
)

echo.
echo ========================================
echo Migration Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Verify all changes with: findstr /s /i "ssghub" .
echo 2. Update version numbers in package.json files
echo 3. Test all services
echo 4. Commit changes to git
echo 5. Publish updated packages to NPM and PyPI
echo.
pause
