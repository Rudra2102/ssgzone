@echo off
echo ========================================
echo SSGhub Mail - Complete Database Setup
echo ========================================

echo Running base schema first...
psql -U postgres -d ssghub_mail -f ../database/init/01_schema.sql
if %errorlevel% neq 0 (
    echo ERROR: Base schema failed
    pause
    exit /b 1
)

echo.
echo Running existing migrations...
for %%f in (../database/migrations/02_*.sql ../database/migrations/03_*.sql ../database/migrations/04_*.sql ../database/migrations/05_*.sql ../database/migrations/06_*.sql ../database/migrations/07_*.sql ../database/migrations/08_*.sql ../database/migrations/09_*.sql) do (
    echo Running %%f...
    psql -U postgres -d ssghub_mail -f "%%f"
)

echo.
echo Running new feature migrations...
psql -U postgres -d ssghub_mail -f ../database/migrations/10_audit_worm_storage.sql
psql -U postgres -d ssghub_mail -f ../database/migrations/11_dmarc_custom_policies.sql
psql -U postgres -d ssghub_mail -f ../database/migrations/12_gdpr_deletion_queue.sql
psql -U postgres -d ssghub_mail -f ../database/migrations/13_usage_based_limits.sql
psql -U postgres -d ssghub_mail -f ../database/migrations/14_migration_tools.sql

echo.
echo ✅ All migrations completed!
echo.
echo Verifying all tables...
psql -U postgres -d ssghub_mail -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

echo.
echo ✅ Database setup complete!
pause