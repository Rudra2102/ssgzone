@echo off
echo ========================================
echo SSGhub Mail - Database Setup
echo ========================================

echo Running database migrations...

psql -U postgres -d ssghub_mail -f ../database/migrations/10_audit_worm_storage.sql
if %errorlevel% neq 0 (
    echo ERROR: Migration 10 failed
    pause
    exit /b 1
)

psql -U postgres -d ssghub_mail -f ../database/migrations/11_dmarc_custom_policies.sql
if %errorlevel% neq 0 (
    echo ERROR: Migration 11 failed
    pause
    exit /b 1
)

psql -U postgres -d ssghub_mail -f ../database/migrations/12_gdpr_deletion_queue.sql
if %errorlevel% neq 0 (
    echo ERROR: Migration 12 failed
    pause
    exit /b 1
)

psql -U postgres -d ssghub_mail -f ../database/migrations/13_usage_based_limits.sql
if %errorlevel% neq 0 (
    echo ERROR: Migration 13 failed
    pause
    exit /b 1
)

psql -U postgres -d ssghub_mail -f ../database/migrations/14_migration_tools.sql
if %errorlevel% neq 0 (
    echo ERROR: Migration 14 failed
    pause
    exit /b 1
)

echo.
echo ✅ All migrations completed successfully!
echo.
echo Verifying tables...
psql -U postgres -d ssghub_mail -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('audit_logs_immutable','tenant_dmarc_policies','gdpr_deletion_queue','tenant_usage_limits','migration_jobs');"

echo.
echo ✅ Database setup complete!
pause