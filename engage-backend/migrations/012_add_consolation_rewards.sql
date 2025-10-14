/**
 * Migration: Add consolation rewards system
 * Handles race condition when campaign exhausts at commit time
 */

-- Table to track consolation rewards issued
CREATE TABLE IF NOT EXISTS consolation_rewards (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  -- Link to visit and campaign
  visit_token VARCHAR(128) NOT NULL,
  campaign_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,

  -- Reward details
  amount DECIMAL(20, 3) NOT NULL DEFAULT 1.000,
  reason ENUM('EXHAUSTED_VISITS_CAP', 'EXHAUSTED_COINS') NOT NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_user_date (user_id, created_at),
  INDEX idx_campaign_date (campaign_id, created_at),
  INDEX idx_visit_token (visit_token),

  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Ensure one consolation per visit
  UNIQUE KEY unique_visit_consolation (visit_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add column to visits table to track consolation rewards (safe check)
SET @dbname = DATABASE();
SET @tablename = 'visits';
SET @columnname = 'is_consolation';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE visits ADD COLUMN is_consolation TINYINT(1) DEFAULT 0 AFTER coins_earned'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Create index for faster queries (safe check)
SET @indexname = 'idx_visits_consolation';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND INDEX_NAME = @indexname
  ) > 0,
  'SELECT 1',
  'CREATE INDEX idx_visits_consolation ON visits(is_consolation, user_id, visit_date)'
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;
