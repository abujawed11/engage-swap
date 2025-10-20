-- ============================================================================
-- EngageSwap - Essential Seed Data
-- ============================================================================
-- This file contains all the important INSERT statements from migration files
-- Run this after creating the database schema to populate initial configuration
-- ============================================================================

USE `engage_swap`;

-- ============================================================================
-- 1. Campaign Limit Configuration (from 020_add_campaign_limit_config.sql)
-- ============================================================================

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

-- ============================================================================
-- 2. Scoring Configuration (from 023_add_scoring_config.sql)
-- ============================================================================

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

-- ============================================================================
-- 3. URL Validator Configuration (from 026_add_url_validator_system.sql)
-- ============================================================================

INSERT INTO `url_validator_config` (`rule_key`, `enabled`, `description`, `metadata`) VALUES
('BLOCK_IP_ADDRESSES', 1, 'Block URLs with numeric IP addresses (e.g., http://192.168.1.1)', '{"priority": 1}'),
('BLOCK_PRIVATE_IPS', 1, 'Block private IP ranges (RFC1918: 10.x, 192.168.x, 172.16-31.x, 127.x, 169.254.x)', '{"priority": 2}'),
('REQUIRE_PUBLIC_SUFFIX', 1, 'Require legitimate public domain suffixes using PSL - supports all ccTLDs (.in, .co.uk, .dev, etc.)', '{"priority": 3}'),
('REQUIRE_HTML_CONTENT', 1, 'Enforce HTML-only content policy (blocks downloads, images, videos)', '{"priority": 4}'),
('FOLLOW_REDIRECTS', 1, 'Follow HTTPS redirects and validate final destination (max 3 redirects)', '{"max_redirects": 3, "priority": 5}'),
('VERIFY_ACCESSIBILITY', 1, 'Perform HTTPS probe to verify URL is accessible', '{"timeout_ms": 5000, "priority": 6}'),
('MAX_URL_LENGTH', 1, 'Enforce maximum URL length limit', '{"max_length": 2048, "priority": 0}'),
('ALLOWED_SCHEMES', 1, 'Only allow HTTPS scheme for security', '{"schemes": ["https"], "priority": 0}')
ON DUPLICATE KEY UPDATE
  `enabled` = VALUES(`enabled`),
  `description` = VALUES(`description`),
  `metadata` = VALUES(`metadata`);

-- ============================================================================
-- 4. Coin Packs (from coin_market_system.sql)
-- ============================================================================

INSERT INTO `coin_packs`
  (`tier_name`, `base_coins`, `bonus_percent`, `price_inr`, `price_usd`, `is_featured`, `is_popular`, `display_order`, `badge_text`)
VALUES
  ('Starter', 100.000, 0.00, 49.00, 0.99, 0, 0, 1, NULL),
  ('Explorer', 250.000, 10.00, 109.00, 1.99, 0, 1, 2, 'Most Popular'),
  ('Growth', 500.000, 15.00, 199.00, 3.99, 0, 0, 3, NULL),
  ('Pro', 1000.000, 20.00, 349.00, 6.99, 1, 0, 4, 'Best Value'),
  ('Power User', 2500.000, 25.00, 799.00, 14.99, 0, 0, 5, NULL),
  ('Business', 5000.000, 30.00, 1399.00, 24.99, 0, 0, 6, NULL);

-- ============================================================================
-- 5. Market Settings (from coin_market_system.sql)
-- ============================================================================

INSERT INTO `market_settings`
  (`is_checkout_enabled`, `banner_message`, `coming_soon_message`, `footer_note`, `fx_hint_usd_to_inr`)
VALUES
  (
    0,
    'Get more coins to boost your campaigns! Choose a pack that fits your needs.',
    'Secure payments via Razorpay/Stripe are being integrated. Expected launch: soon!',
    'Prices may change without prior notice. All prices are inclusive of applicable taxes.',
    83.5000
  );

-- ============================================================================
-- Verification Queries
-- ============================================================================

SELECT 'Seed data inserted successfully!' AS message;

SELECT 'Campaign Limit Config:' AS section;
SELECT COUNT(*) AS config_count FROM campaign_limit_config;

SELECT 'URL Validator Config:' AS section;
SELECT COUNT(*) AS rule_count FROM url_validator_config;

SELECT 'Coin Packs:' AS section;
SELECT COUNT(*) AS pack_count FROM coin_packs;

SELECT 'Market Settings:' AS section;
SELECT COUNT(*) AS settings_count FROM market_settings;
