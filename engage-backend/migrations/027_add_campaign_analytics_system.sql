-- Migration: Campaign Analytics System
-- Creates tables and indexes for campaign analytics dashboard

-- ============================================================================
-- STEP 1: Create Campaign Analytics Daily Aggregation Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS `campaign_analytics_daily` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_id` BIGINT NOT NULL,
  `date_ist` DATE NOT NULL COMMENT 'Calendar date in Asia/Kolkata (IST) timezone',

  -- Visit Metrics
  `total_visits` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total visits started',
  `completed_visits` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Visits that completed timer + quiz',
  `abandoned_visits` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Visits that were abandoned',

  -- Watch Time Metrics
  `total_watch_time_sec` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Sum of all watch durations',
  `avg_watch_time_sec` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Average watch time',

  -- Quiz Metrics
  `total_quiz_attempts` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total quiz submissions',
  `total_correct_answers` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Sum of correct answers',
  `total_quiz_questions` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Sum of total questions (usually 5 per attempt)',
  `avg_quiz_accuracy` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Average quiz accuracy percentage',

  -- Financial Metrics
  `coins_spent` DECIMAL(20,3) NOT NULL DEFAULT 0.000 COMMENT 'Total coins spent on payouts',
  `avg_coins_per_completion` DECIMAL(20,3) NOT NULL DEFAULT 0.000 COMMENT 'Effective CPA',

  -- Device Breakdown
  `visits_desktop` INT UNSIGNED NOT NULL DEFAULT 0,
  `visits_mobile` INT UNSIGNED NOT NULL DEFAULT 0,
  `visits_unknown` INT UNSIGNED NOT NULL DEFAULT 0,

  -- Metadata
  `last_computed_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'When this row was last computed/updated',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_campaign_date` (`campaign_id`, `date_ist`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_date_ist` (`date_ist`),
  KEY `idx_campaign_date_range` (`campaign_id`, `date_ist`),

  CONSTRAINT `fk_analytics_campaign`
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Daily aggregated analytics for campaigns (IST timezone)';

-- ============================================================================
-- STEP 2: Add Missing Indexes for Analytics Queries
-- ============================================================================

-- Visits table indexes for analytics
-- Check and add indexes only if they don't exist
SET @exist_idx_campaign_visited_at := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
  AND table_name = 'visits'
  AND index_name = 'idx_campaign_visited_at'
);

SET @sql_add_idx1 := IF(@exist_idx_campaign_visited_at = 0,
  'ALTER TABLE `visits` ADD INDEX `idx_campaign_visited_at` (`campaign_id`, `visited_at`)',
  'SELECT "Index idx_campaign_visited_at already exists" AS message'
);
PREPARE stmt FROM @sql_add_idx1;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist_idx_user_visited_at := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
  AND table_name = 'visits'
  AND index_name = 'idx_user_visited_at'
);

SET @sql_add_idx2 := IF(@exist_idx_user_visited_at = 0,
  'ALTER TABLE `visits` ADD INDEX `idx_user_visited_at` (`user_id`, `visited_at`)',
  'SELECT "Index idx_user_visited_at already exists" AS message'
);
PREPARE stmt FROM @sql_add_idx2;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Quiz attempts indexes for analytics
SET @exist_idx_campaign_submitted := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
  AND table_name = 'quiz_attempts'
  AND index_name = 'idx_campaign_submitted_at'
);

SET @sql_add_idx3 := IF(@exist_idx_campaign_submitted = 0,
  'ALTER TABLE `quiz_attempts` ADD INDEX `idx_campaign_submitted_at` (`campaign_id`, `submitted_at`)',
  'SELECT "Index idx_campaign_submitted_at already exists" AS message'
);
PREPARE stmt FROM @sql_add_idx3;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist_idx_user_submitted := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
  AND table_name = 'quiz_attempts'
  AND index_name = 'idx_user_submitted_at'
);

SET @sql_add_idx4 := IF(@exist_idx_user_submitted = 0,
  'ALTER TABLE `quiz_attempts` ADD INDEX `idx_user_submitted_at` (`user_id`, `submitted_at`)',
  'SELECT "Index idx_user_submitted_at already exists" AS message'
);
PREPARE stmt FROM @sql_add_idx4;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Wallet transactions indexes for campaign spending
SET @exist_idx_campaign_created := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
  AND table_name = 'wallet_transactions'
  AND index_name = 'idx_campaign_created_at'
);

SET @sql_add_idx5 := IF(@exist_idx_campaign_created = 0,
  'ALTER TABLE `wallet_transactions` ADD INDEX `idx_campaign_created_at` (`campaign_id`, `created_at`)',
  'SELECT "Index idx_campaign_created_at already exists" AS message'
);
PREPARE stmt FROM @sql_add_idx5;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist_idx_source_created := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
  AND table_name = 'wallet_transactions'
  AND index_name = 'idx_source_created_at'
);

SET @sql_add_idx6 := IF(@exist_idx_source_created = 0,
  'ALTER TABLE `wallet_transactions` ADD INDEX `idx_source_created_at` (`source`, `created_at`)',
  'SELECT "Index idx_source_created_at already exists" AS message'
);
PREPARE stmt FROM @sql_add_idx6;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- STEP 3: Create Helper View for Real-Time Analytics (Optional)
-- ============================================================================

-- View for campaign-level metrics (used when daily table not yet aggregated)
CREATE OR REPLACE VIEW `campaign_analytics_realtime` AS
SELECT
  c.id as campaign_id,
  c.title,
  c.user_id as owner_id,

  -- Visit counts
  COUNT(DISTINCT v.id) as total_visits,
  SUM(CASE WHEN qa.passed = 1 THEN 1 ELSE 0 END) as completed_visits,

  -- Completion rate
  CASE
    WHEN COUNT(DISTINCT v.id) > 0
    THEN ROUND((SUM(CASE WHEN qa.passed = 1 THEN 1 ELSE 0 END) / COUNT(DISTINCT v.id)) * 100, 2)
    ELSE 0.00
  END as completion_rate_pct,

  -- Quiz metrics
  COUNT(qa.id) as total_quiz_attempts,
  CASE
    WHEN COUNT(qa.id) > 0
    THEN ROUND(AVG((qa.correct_count / qa.total_count) * 100), 2)
    ELSE 0.00
  END as avg_quiz_accuracy_pct,

  -- Financial metrics
  c.coins_per_visit,
  c.total_clicks,
  c.clicks_served,
  (c.total_clicks - c.clicks_served) as clicks_remaining

FROM campaigns c
LEFT JOIN visits v ON c.id = v.campaign_id
LEFT JOIN quiz_attempts qa ON v.visit_token = qa.visit_token

GROUP BY c.id, c.title, c.user_id, c.coins_per_visit, c.total_clicks, c.clicks_served;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify the daily analytics table was created
SELECT COUNT(*) as daily_table_exists
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'campaign_analytics_daily';

-- Verify indexes were added
SELECT
  table_name,
  index_name,
  GROUP_CONCAT(column_name ORDER BY seq_in_index) as columns
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND table_name IN ('visits', 'quiz_attempts', 'wallet_transactions')
  AND index_name LIKE 'idx_%'
GROUP BY table_name, index_name
ORDER BY table_name, index_name;

-- Verify the realtime view was created
SELECT COUNT(*) as realtime_view_exists
FROM information_schema.views
WHERE table_schema = DATABASE()
  AND table_name = 'campaign_analytics_realtime';
