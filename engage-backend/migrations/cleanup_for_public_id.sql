-- Clean up all data to allow adding generated columns
-- WARNING: This will delete ALL data from the database!

SET FOREIGN_KEY_CHECKS = 0;

-- Delete all data from tables (in reverse dependency order)
TRUNCATE TABLE visits;
TRUNCATE TABLE visit_tokens;
TRUNCATE TABLE email_otps;
TRUNCATE TABLE campaigns;
TRUNCATE TABLE users;

-- Reset auto-increment counters
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE campaigns AUTO_INCREMENT = 1;
ALTER TABLE visits AUTO_INCREMENT = 1;
ALTER TABLE visit_tokens AUTO_INCREMENT = 1;
ALTER TABLE email_otps AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'All data cleared. You can now run the public_id migrations.' AS message;
