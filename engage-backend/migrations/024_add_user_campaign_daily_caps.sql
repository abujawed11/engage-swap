-- Migration: Add user_campaign_daily_caps table for midnight-reset daily counter
-- This table tracks per-user, per-campaign, per-day attempts with automatic midnight reset (IST)
-- Replaces the rolling 24-hour window with a calendar-day-based counter

CREATE TABLE IF NOT EXISTS `user_campaign_daily_caps` (
  `user_id` BIGINT NOT NULL,
  `campaign_id` BIGINT NOT NULL,
  `date_key` DATE NOT NULL COMMENT 'Local date in Asia/Kolkata (IST) timezone',
  `attempts` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`user_id`, `campaign_id`, `date_key`),

  KEY `idx_user_id` (`user_id`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_date_key` (`date_key`),
  KEY `idx_user_date` (`user_id`, `date_key`),

  CONSTRAINT `user_campaign_daily_caps_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_campaign_daily_caps_ibfk_2`
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_attempts_non_negative`
    CHECK (`attempts` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Daily attempt counter that resets at midnight IST (calendar-day based)';

-- Optional: Add index for cleanup queries (if needed in future)
CREATE INDEX `idx_date_key_cleanup` ON `user_campaign_daily_caps` (`date_key`);
