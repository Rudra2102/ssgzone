@echo off
echo ========================================
echo Task 2.2: Migration Tools API Testing
echo ========================================

echo Testing migration jobs endpoint...
curl -X GET http://localhost:3005/api/v1/migration/jobs ^
  -H "Authorization: Bearer tenant_admin_token"

echo.
echo.
echo Checking migration jobs in database...
psql -U postgres -d ssghub_mail -c "SELECT target_email, file_type, status, progress_percentage FROM migration_jobs;"

echo.
echo.
echo Testing migration status (if jobs exist)...
psql -U postgres -d ssghub_mail -c "SELECT id FROM migration_jobs LIMIT 1;" -t -A > temp_job_id.txt
set /p JOB_ID=<temp_job_id.txt
del temp_job_id.txt

if not "%JOB_ID%"=="" (
    echo Getting status for job ID: %JOB_ID%
    curl -X GET http://localhost:3005/api/v1/migration/status/%JOB_ID% ^
      -H "Authorization: Bearer tenant_admin_token"
) else (
    echo No migration jobs found. Upload a file via Admin Portal first.
)

echo.
echo ✅ Task 2.2 Migration Tools API test completed!
echo.
echo Manual steps:
echo 1. Open http://localhost:3001
echo 2. Go to Migration Tools
echo 3. Upload test_mailbox.mbox file
echo 4. Monitor progress
pause