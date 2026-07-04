@echo off
echo ========================================
echo Task 2.2: Creating Test MBOX File
echo ========================================

echo Creating test MBOX file...
(
echo From test@example.com Mon Jan 01 00:00:00 2024
echo From: test@example.com
echo To: user@tenant.lms.ssghub.com
echo Subject: Test Email 1
echo.
echo This is test email 1.
echo.
echo From test@example.com Mon Jan 01 00:01:00 2024
echo From: test@example.com
echo To: user@tenant.lms.ssghub.com
echo Subject: Test Email 2
echo.
echo This is test email 2.
echo.
echo From test@example.com Mon Jan 01 00:02:00 2024
echo From: test@example.com
echo To: user@tenant.lms.ssghub.com
echo Subject: Test Email 3
echo.
echo This is test email 3 with more content for testing purposes.
echo This email has multiple lines to simulate real email content.
echo.
) > test_mailbox.mbox

echo ✅ Test MBOX file created: test_mailbox.mbox
echo.
echo File contents:
type test_mailbox.mbox
echo.
echo.
echo ✅ Now proceed to Admin Portal testing!
echo Open http://localhost:3001 and use Migration Tools to upload this file.
pause