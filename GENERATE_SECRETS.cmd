@echo off
echo ========================================
echo SSGhub Mail - SECRET GENERATOR
echo ========================================
echo Generating secure secrets for production
echo.

echo [1/3] Generating JWT Secret (64 characters)...
powershell -Command "[System.Web.Security.Membership]::GeneratePassword(64, 10)" > jwt_secret.txt
set /p JWT_SECRET=<jwt_secret.txt
echo JWT_SECRET=%JWT_SECRET%
echo.

echo [2/3] Generating Encryption Key (32 characters)...
powershell -Command "[System.Web.Security.Membership]::GeneratePassword(32, 5)" > encryption_key.txt
set /p ENCRYPTION_KEY=<encryption_key.txt
echo ENCRYPTION_KEY=%ENCRYPTION_KEY%
echo.

echo [3/3] Creating updated .env file...
echo # SSGhub Mail Production Environment Configuration > .env
echo. >> .env
echo # Database Configuration >> .env
echo DB_HOST=postgres >> .env
echo DB_PORT=5432 >> .env
echo DB_NAME=ssghub_mail >> .env
echo DB_USER=ssghub >> .env
echo DB_PASSWORD=YourStrongDBPassword >> .env
echo. >> .env
echo # Security Configuration >> .env
echo JWT_SECRET=%JWT_SECRET% >> .env
echo ENCRYPTION_KEY=%ENCRYPTION_KEY% >> .env
echo. >> .env
echo # Redis Configuration >> .env
echo REDIS_HOST=redis >> .env
echo REDIS_PORT=6379 >> .env
echo. >> .env
echo # Mail Server Configuration >> .env
echo DOMAIN=ssghub.com >> .env
echo SMTP_HOST=mail-server >> .env
echo SMTP_PORT=25 >> .env
echo SMTP_SECURE=true >> .env
echo. >> .env
echo # API Gateway Configuration >> .env
echo API_PORT=4000 >> .env
echo RATE_LIMIT_WINDOW=900000 >> .env
echo RATE_LIMIT_MAX=100 >> .env
echo. >> .env
echo # MinIO Configuration >> .env
echo MINIO_ENDPOINT=minio:9000 >> .env
echo MINIO_ACCESS_KEY=minioadmin >> .env
echo MINIO_SECRET_KEY=minioadmin >> .env
echo MINIO_BUCKET=ssghub-attachments >> .env
echo. >> .env
echo # Elasticsearch Configuration >> .env
echo ELASTICSEARCH_HOST=elasticsearch:9200 >> .env
echo. >> .env
echo # Services >> .env
echo WARMUP_SERVICE_URL=http://ip-warmup-service:3004 >> .env
echo CALENDAR_PORT=4003 >> .env
echo DNS_PORT=3005 >> .env
echo. >> .env
echo # SSL Configuration >> .env
echo SSL_ENABLED=true >> .env
echo SSL_CERT_PATH=/etc/ssl/certs/ssghub.com.crt >> .env
echo SSL_KEY_PATH=/etc/ssl/private/ssghub.com.key >> .env
echo. >> .env
echo # Monitoring >> .env
echo LOG_LEVEL=info >> .env
echo METRICS_ENABLED=true >> .env
echo HEALTH_CHECK_INTERVAL=30050 >> .env

echo ✅ .env file created with generated secrets

echo.
echo ========================================
echo 🔑 GENERATED SECRETS
echo ========================================
echo.
echo JWT_SECRET: %JWT_SECRET%
echo ENCRYPTION_KEY: %ENCRYPTION_KEY%
echo.
echo ⚠️  IMPORTANT: 
echo 1. Edit .env file and replace "YourStrongDBPassword" with your actual DB password
echo 2. Keep these secrets secure - don't share them
echo 3. These are production secrets - save them safely
echo.

del jwt_secret.txt encryption_key.txt 2>nul

echo Next step: Edit .env file and update DB_PASSWORD
echo Then run: QUICK_PRODUCTION_TEST.cmd
echo.
pause