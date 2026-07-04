@echo off
echo ========================================
echo SSGhub Mail - QUICK DOCKER TEST
echo ========================================

:: Check Docker
docker --version
if %errorlevel% neq 0 (
    echo ERROR: Docker not installed
    pause
    exit /b 1
)

:: Check Docker running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Desktop not running
    pause
    exit /b 1
)

:: Test Docker Compose
docker compose version >nul 2>&1
if %errorlevel% equ 0 (
    echo Using: docker compose
    docker compose up -d
    timeout /t 30
    docker compose ps
    echo.
    echo Testing API Gateway...
    curl -s http://localhost:4000/health
    echo.
    echo Testing Database...
    docker exec ssghub-postgres-1 psql -U ssghub -d ssghub_mail -c "SELECT 1;"
) else (
    docker-compose --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Using: docker-compose
        docker-compose up -d
        timeout /t 30
        docker-compose ps
        echo.
        echo Testing API Gateway...
        curl -s http://localhost:4000/health
        echo.
        echo Testing Database...
        docker exec ssghub-postgres-1 psql -U ssghub -d ssghub_mail -c "SELECT 1;"
    ) else (
        echo ERROR: No Docker Compose found
        pause
        exit /b 1
    )
)

pause