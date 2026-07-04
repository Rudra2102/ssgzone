-- Update password for namrata.singh user in SSGzone database
UPDATE users 
SET password_hash = '$2a$12$wJLBuPTKw0G4ZbrVMrIOkORnFZhrVRR7fO9hXoztddLNGkxg7O9nm', 
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'namrata.singh@prashastacademy.pems.ssgzone.in';

-- Verify the update
SELECT id, email, first_name, last_name, status, updated_at 
FROM users 
WHERE email = 'namrata.singh@prashastacademy.pems.ssgzone.in';