@echo off
echo ========================================
echo SSGhub Mail - Create Database
echo ========================================

echo Creating database if not exists...
psql -U postgres -c "CREATE DATABASE ssghub_mail;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Database created successfully!
) else (
    echo ℹ️ Database already exists or creation failed - continuing...
)

echo.
echo ✅ Database creation step complete!
pause