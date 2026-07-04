@echo off
echo ========================================
echo RENAMING PROJECT: SSGhub → SSGzone
echo ========================================
echo Updating all references from ssghub.com to ssgzone.com
echo.

cd /d "d:\Pradeep_Singh\Creations\Softwares\SSGhub"

echo [1/4] Generating secrets and creating .env file...
powershell -Command "[System.Web.Security.Membership]::GeneratePassword(64, 10)" > jwt_secret.txt
set /p JWT_SECRET=<jwt_secret.txt
powershell -Command "[System.Web.Security.Membership]::GeneratePassword(32, 5)" > encryption_key.txt
set /p ENCRYPTION_KEY=<encryption_key.txt

echo # SSGzone Mail Production Environment Configuration > .env
echo. >> .env
echo # Database Configuration >> .env
echo DB_HOST=postgres >> .env
echo DB_PORT=5432 >> .env
echo DB_NAME=ssgzone_mail >> .env
echo DB_USER=ssgzone >> .env
echo DB_PASSWORD=academy >> .env
echo. >> .env
echo # Security Configuration >> .env
echo JWT_SECRET=%JWT_SECRET% >> .env
echo ENCRYPTION_KEY=%ENCRYPTION_KEY% >> .env
echo. >> .env
echo # Mail Server Configuration >> .env
echo DOMAIN=ssgzone.com >> .env
echo SMTP_HOST=mail-server >> .env
echo SMTP_PORT=25 >> .env
echo SMTP_SECURE=true >> .env
echo SMTP_TLS_CERT=/etc/ssl/certs/ssgzone.com.crt >> .env
echo SMTP_TLS_KEY=/etc/ssl/private/ssgzone.com.key >> .env
echo. >> .env
echo # API Gateway Configuration >> .env
echo API_PORT=4000 >> .env
echo RATE_LIMIT_WINDOW=900000 >> .env
echo RATE_LIMIT_MAX=100 >> .env
echo. >> .env
echo # SSL Configuration >> .env
echo SSL_ENABLED=true >> .env
echo SSL_CERT_PATH=/etc/ssl/certs/ssgzone.com.crt >> .env
echo SSL_KEY_PATH=/etc/ssl/private/ssgzone.com.key >> .env
echo. >> .env
echo # DKIM Configuration >> .env
echo DKIM_PRIVATE_KEY_PATH=/etc/dkim/ssgzone.com.private >> .env
echo DKIM_SELECTOR=default >> .env
echo. >> .env
echo # Other Services >> .env
echo REDIS_HOST=redis >> .env
echo REDIS_PORT=6379 >> .env
echo MINIO_ENDPOINT=minio:9000 >> .env
echo MINIO_ACCESS_KEY=minioadmin >> .env
echo MINIO_SECRET_KEY=minioadmin >> .env
echo MINIO_BUCKET=ssgzone-attachments >> .env
echo ELASTICSEARCH_HOST=elasticsearch:9200 >> .env
echo WARMUP_SERVICE_URL=http://ip-warmup-service:3004 >> .env
echo CALENDAR_PORT=4003 >> .env
echo DNS_PORT=3005 >> .env
echo LOG_LEVEL=info >> .env
echo METRICS_ENABLED=true >> .env
echo HEALTH_CHECK_INTERVAL=30050 >> .env

del jwt_secret.txt encryption_key.txt 2>nul
echo ✅ .env file created with ssgzone.com domain

echo.
echo [2/4] Creating SSL certificates for ssgzone.com...
if not exist "config\ssl\certs" mkdir config\ssl\certs
if not exist "config\ssl\private" mkdir config\ssl\private
if not exist "config\dkim" mkdir config\dkim

openssl req -x509 -newkey rsa:2048 -keyout config\ssl\private\ssgzone.com.key -out config\ssl\certs\ssgzone.com.crt -days 365 -nodes -subj "/CN=ssgzone.com/O=SSGzone Mail/C=US" 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  OpenSSL not found. SSL certificate not generated.
) else (
    echo ✅ SSL certificate generated for ssgzone.com
)

openssl genrsa -out config\dkim\ssgzone.com.private 2048 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  DKIM key not generated
) else (
    echo ✅ DKIM key generated for ssgzone.com
)

echo.
echo [3/4] Updating database schema...
powershell -Command "(Get-Content 'database\init\01_schema.sql') -replace 'ssghub', 'ssgzone' | Set-Content 'database\init\01_schema.sql'"
echo ✅ Database schema updated

echo.
echo [4/4] Creating updated README...
echo # SSGzone Mail - Independent Email Service Platform > README_SSGZONE.md
echo. >> README_SSGZONE.md
echo ## Overview >> README_SSGZONE.md
echo SSGzone Mail is an API-first, scalable email service platform that provides custom, dedicated email accounts for multi-tenant SaaS applications using the ssgzone.com domain. >> README_SSGZONE.md
echo. >> README_SSGZONE.md
echo ## Email Structure >> README_SSGZONE.md
echo ```  >> README_SSGZONE.md
echo username@tenant_slug.saas_slug.ssgzone.com >> README_SSGZONE.md
echo ``` >> README_SSGZONE.md
echo. >> README_SSGZONE.md
echo ### Examples >> README_SSGZONE.md
echo - `amit.shah@nabc.lms.ssgzone.com` >> README_SSGZONE.md
echo - `ajay.singh@abcdevelopers.rupyo.ssgzone.com` >> README_SSGZONE.md
echo. >> README_SSGZONE.md
echo ## Quick Start >> README_SSGZONE.md
echo 1. Run: QUICK_PRODUCTION_TEST.cmd >> README_SSGZONE.md
echo 2. Access Admin Portal: http://localhost:4001 >> README_SSGZONE.md
echo 3. Access Webmail: http://localhost:4002 >> README_SSGZONE.md
echo ✅ README updated for SSGzone

echo.
echo ========================================
echo 🎉 PROJECT RENAMED: SSGzone Mail
echo ========================================
echo.
echo ✅ Domain changed: ssghub.com → ssgzone.com
echo ✅ Database: ssgzone_mail (password: academy)
echo ✅ SSL certificates generated for ssgzone.com
echo ✅ Email format: user@tenant.saas.ssgzone.com
echo.
echo 🔑 Generated Secrets:
echo JWT_SECRET: %JWT_SECRET%
echo ENCRYPTION_KEY: %ENCRYPTION_KEY%
echo.
echo Next steps:
echo 1. Run: QUICK_PRODUCTION_TEST.cmd
echo 2. Test email: user@company.lms.ssgzone.com
echo.
pause