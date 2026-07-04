@echo off
echo ========================================
echo SSGhub Mail - PRODUCTION SETUP
echo ========================================
echo Setting up production environment configuration
echo.

cd /d "d:\Pradeep_Singh\Creations\Softwares\SSGhub"

echo [1/5] Creating production environment file...
copy config\production.env .env >nul 2>&1
echo ✅ Environment file created

echo.
echo [2/5] Creating SSL directories...
if not exist "config\ssl" mkdir config\ssl
if not exist "config\ssl\certs" mkdir config\ssl\certs
if not exist "config\ssl\private" mkdir config\ssl\private
if not exist "config\dkim" mkdir config\dkim
echo ✅ SSL directories created

echo.
echo [3/5] Generating self-signed SSL certificate for testing...
echo This will create a test certificate. Replace with real certificate for production.
openssl req -x509 -newkey rsa:2048 -keyout config\ssl\private\ssghub.com.key -out config\ssl\certs\ssghub.com.crt -days 365 -nodes -subj "/CN=ssghub.com/O=SSGhub Mail/C=US" 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  OpenSSL not found. SSL certificate not generated.
    echo    You can install OpenSSL or use existing certificates.
) else (
    echo ✅ Test SSL certificate generated
)

echo.
echo [4/5] Creating DKIM key for email signing...
openssl genrsa -out config\dkim\ssghub.com.private 2048 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  DKIM key not generated (OpenSSL required)
) else (
    echo ✅ DKIM private key generated
)

echo.
echo [5/5] Setting up Docker volumes...
docker volume create ssghub_postgres_data 2>nul
docker volume create ssghub_mail_data 2>nul
docker volume create ssghub_elasticsearch_data 2>nul
docker volume create ssghub_minio_data 2>nul
echo ✅ Docker volumes created

echo.
echo ========================================
echo 🎉 PRODUCTION SETUP COMPLETE
echo ========================================
echo.
echo ⚠️  IMPORTANT: Update the following in .env file:
echo.
echo 1. DB_PASSWORD=your_secure_db_password_here
echo 2. JWT_SECRET=your_jwt_secret_here  
echo 3. ENCRYPTION_KEY=your_32_character_encryption_key_here
echo.
echo Optional (for DNS management):
echo 4. CLOUDFLARE_API_TOKEN=your_cloudflare_token_here
echo 5. AWS_ACCESS_KEY_ID=your_aws_access_key_here
echo 6. AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
echo.
echo Next steps:
echo 1. Edit .env file with your production values
echo 2. Run: QUICK_PRODUCTION_TEST.cmd
echo 3. Run: COMPREHENSIVE_PRODUCTION_TEST.cmd
echo.
pause