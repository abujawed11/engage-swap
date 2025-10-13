-- Drop all tables to start fresh
-- WARNING: This will permanently delete ALL data and tables!

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS visits;
DROP TABLE IF EXISTS visit_tokens;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS email_otps;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'All tables dropped. Run migrations in order to recreate.' AS message;
