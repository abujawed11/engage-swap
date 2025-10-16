-- Migration: Add campaign enforcement logs for analytics and observability
-- This table logs all enforcement decisions (allow, block, cooldown, limit reached)

CREATE TABLE IF NOT EXISTS `campaign_enforcement_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `campaign_id` BIGINT NOT NULL,
  `coins_per_visit` DECIMAL(20,3) NOT NULL,
  `value_tier` ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL,
  `outcome` ENUM('ALLOW', 'LIMIT_REACHED', 'COOLDOWN_ACTIVE', 'ACTIVE_SESSION_EXISTS', 'CAMPAIGN_UNAVAILABLE') NOT NULL,
  `attempt_count_24h` INT NOT NULL DEFAULT 0,
  `seconds_since_last_attempt` INT NULL,
  `retry_after_sec` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_outcome` (`outcome`),
  KEY `idx_value_tier` (`value_tier`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_campaign_date` (`user_id`, `campaign_id`, `created_at`),

  CONSTRAINT `campaign_enforcement_logs_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `campaign_enforcement_logs_ibfk_2`
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
