@echo off
echo ========================================
echo SSGhub Mail Platform Setup
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose is not available
    echo Please ensure Docker Compose is installed
    pause
    exit /b 1
)

echo Docker and Docker Compose are available
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env file with your configuration before continuing
    echo Press any key to open .env file in notepad...
    pause >nul
    notepad .env
    echo.
)

REM Create necessary directories
echo Creating directories...
if not exist "data\postgres" mkdir data\postgres
if not exist "data\redis" mkdir data\redis
if not exist "data\mail" mkdir data\mail
if not exist "logs" mkdir logs
echo Directories created successfully
echo.

REM Build and start services
echo Building and starting services...
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo ERROR: Failed to start services
    pause
    exit /b 1
)

echo.
echo Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check service status
echo Checking service status...
docker-compose ps

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Services are running on:
echo - API Gateway: http://localhost:3005
echo - Admin Portal: http://localhost:3001
echo - Webmail Client: http://localhost:3002
echo - PostgreSQL: localhost:5432
echo - Redis: localhost:6379
echo.
echo Next steps:
echo 1. Access Admin Portal at http://localhost:3001
echo 2. Register your first SaaS application
echo 3. Create tenants and users
echo.
echo To stop services: docker-compose down
echo To view logs: docker-compose logs -f
echo.
pause