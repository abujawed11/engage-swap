-- Migration: Add campaign rotation tracking for fair exposure
-- This table tracks when each campaign was last served to each user for rotation fairness

CREATE TABLE IF NOT EXISTS `campaign_rotation_tracking` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `campaign_id` BIGINT NOT NULL,
  `last_served_at` DATETIME NOT NULL,
  `serve_count` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_campaign_rotation` (`user_id`, `campaign_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_last_served` (`last_served_at`),
  KEY `idx_user_last_served` (`user_id`, `last_served_at`),

  CONSTRAINT `campaign_rotation_tracking_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `campaign_rotation_tracking_ibfk_2`
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
