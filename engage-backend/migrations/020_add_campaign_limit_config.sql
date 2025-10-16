-- Migration: Add campaign limit configuration table
-- This table stores configurable limits for attempt counts, cooldowns, and rotation windows

CREATE TABLE IF NOT EXISTS `campaign_limit_config` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `config_key` VARCHAR(50) NOT NULL,
  `config_value` JSON NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration values
INSERT INTO `campaign_limit_config` (`config_key`, `config_value`, `description`) VALUES
(
  'attempt_limits',
  JSON_OBJECT(
    'high', 2,
    'medium', 3,
    'low', 5
  ),
  'Maximum attempts per user per campaign per 24 hours by value tier'
),
(
  'value_thresholds',
  JSON_OBJECT(
    'high', 10,
    'medium', 5
  ),
  'Coin value thresholds for tier classification (high >= 10, medium >= 5, low < 5)'
),
(
  'cooldown_seconds',
  JSON_OBJECT(
    'value', 3600
  ),
  'Minimum cooldown between attempts in seconds (default: 1 hour = 3600 seconds)'
),
(
  'rotation_windows',
  JSON_OBJECT(
    'high', 21600,
    'medium', 10800,
    'low', 3600
  ),
  'Rotation window in seconds by value tier (high: 6h, medium: 3h, low: 1h)'
),
(
  'active_session_timeout',
  JSON_OBJECT(
    'value', 600
  ),
  'Maximum time in seconds for an active session before it can be resumed/overridden (default: 10 minutes = 600 seconds)'
);
