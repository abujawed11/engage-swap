-- Reset AUTO_INCREMENT counters for all tables
-- Use this script if you want to start fresh with ID = 1

-- IMPORTANT: Only run this on a fresh/development database!
-- This will cause issues if you have existing data with foreign key relationships

-- Check current AUTO_INCREMENT values first
SELECT
    TABLE_NAME,
    AUTO_INCREMENT
FROM
    information_schema.TABLES
WHERE
    TABLE_SCHEMA = 'engage_swap'
    AND AUTO_INCREMENT IS NOT NULL
ORDER BY TABLE_NAME;

-- Reset AUTO_INCREMENT for all main tables
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE pending_users AUTO_INCREMENT = 1;
ALTER TABLE email_otps AUTO_INCREMENT = 1;
ALTER TABLE pending_user_otps AUTO_INCREMENT = 1;
ALTER TABLE campaigns AUTO_INCREMENT = 1;
ALTER TABLE campaign_questions AUTO_INCREMENT = 1;
ALTER TABLE wallets AUTO_INCREMENT = 1;
ALTER TABLE visits AUTO_INCREMENT = 1;
ALTER TABLE quiz_attempts AUTO_INCREMENT = 1;
ALTER TABLE transactions AUTO_INCREMENT = 1;
ALTER TABLE coin_packs AUTO_INCREMENT = 1;
ALTER TABLE coin_pack_purchases AUTO_INCREMENT = 1;
ALTER TABLE campaign_rotation_tracking AUTO_INCREMENT = 1;
ALTER TABLE campaign_enforcement_logs AUTO_INCREMENT = 1;
ALTER TABLE campaign_analytics_daily AUTO_INCREMENT = 1;
ALTER TABLE campaign_limit_config AUTO_INCREMENT = 1;

-- Verify the changes
SELECT
    TABLE_NAME,
    AUTO_INCREMENT
FROM
    information_schema.TABLES
WHERE
    TABLE_SCHEMA = 'engage_swap'
    AND AUTO_INCREMENT IS NOT NULL
ORDER BY TABLE_NAME;

-- Show how many rows are in each table
SELECT
    TABLE_NAME,
    TABLE_ROWS
FROM
    information_schema.TABLES
WHERE
    TABLE_SCHEMA = 'engage_swap'
    AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
