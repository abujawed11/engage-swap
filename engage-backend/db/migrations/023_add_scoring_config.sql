-- Migration: Add scoring configuration
-- Description: Adds score-based campaign ranking configuration to campaign_limit_config table

INSERT INTO `campaign_limit_config` (`config_key`, `config_value`, `description`)
VALUES (
  'scoring_config',
  JSON_OBJECT(
    'weights', JSON_OBJECT(
      'payout', 1.0,
      'progress', 0.5,
      'fresh', 0.25,
      'recent_penalty', 1.5,
      'exposure_penalty', 0.5
    ),
    'freshness_cap_sec', 259200,
    'rotation_windows', JSON_OBJECT(
      'high', 21600,
      'medium', 10800,
      'low', 3600
    ),
    'exposure_cap_ratio', 0.40,
    'jitter_band', 0.02
  ),
  'Score-based campaign ranking configuration'
)
ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  description = VALUES(description);
