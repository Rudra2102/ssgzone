@echo off
echo Updating SSGhub Mail to use ssgzone.in domain...

echo.
echo Step 1: Configuration files updated ✓
echo Step 2: Database schema updated ✓  
echo Step 3: Docker compose files updated ✓
echo Step 4: DNS service updated ✓

echo.
echo MANUAL STEPS REQUIRED:
echo.
echo 1. SSL Certificate Files:
echo    - Rename config/ssl/certs/ssghub.com.crt to ssgzone.in.crt
echo    - Rename config/ssl/private/ssghub.com.key to ssgzone.in.key
echo.
echo 2. DKIM Key Files:
echo    - Rename config/dkim/ssghub.com.private to ssgzone.in.private
echo.
echo 3. MinIO Bucket:
echo    - Update bucket name from ssghub-attachments to ssgzone-attachments
echo.
echo 4. Database Name (Optional):
echo    - Consider renaming database from ssghub_mail to ssgzone_mail
echo.

echo Domain update preparation complete!
echo Next: Configure DNS settings for ssgzone.in
pause