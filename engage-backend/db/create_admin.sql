-- Check if admin user exists
SELECT id, username, email, is_admin FROM users WHERE email_lower = 'abubakar.jawed@gmail.com';

-- If user exists but is not admin, update to admin:
UPDATE users
SET is_admin = 1
WHERE email_lower = 'abubakar.jawed@gmail.com';

-- Verify the update:
SELECT id, username, email, is_admin FROM users WHERE email_lower = 'abubakar.jawed@gmail.com';
