-- Migration: Add user_campaign_activity table for tracking per-user attempt limits and cooldowns
-- This table tracks how many times each user has attempted each campaign within a 24-hour window

CREATE TABLE IF NOT EXISTS `user_campaign_activity` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `campaign_id` BIGINT NOT NULL,
  `attempt_count_24h` INT NOT NULL DEFAULT 0,
  `last_attempt_at` DATETIME NULL,
  `last_claimed_at` DATETIME NULL,
  `active_session_token` VARCHAR(64) NULL,
  `active_session_started_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_campaign` (`user_id`, `campaign_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_last_attempt` (`last_attempt_at`),
  KEY `idx_active_session` (`active_session_token`),

  CONSTRAINT `user_campaign_activity_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_campaign_activity_ibfk_2`
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
