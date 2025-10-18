-- Migration: URL Validator System
-- Creates tables for URL validation configuration and audit logging

-- ============================================================================
-- STEP 1: Create URL Validator Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS `url_validator_config` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `rule_key` VARCHAR(100) NOT NULL COMMENT 'Unique key for the validation rule',
  `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = enabled, 0 = disabled',
  `description` TEXT COMMENT 'Human-readable description of what this rule does',
  `metadata` JSON COMMENT 'Additional configuration data for the rule',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rule_key` (`rule_key`),
  KEY `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration table for URL validation rules';

-- ============================================================================
-- STEP 2: Create URL Validation Logs Table (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `url_validation_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `correlation_id` VARCHAR(36) NOT NULL COMMENT 'UUID for tracking the validation request',
  `user_id` BIGINT COMMENT 'User who submitted the URL (NULL if anonymous)',
  `url` TEXT NOT NULL COMMENT 'The URL that was validated',
  `verdict` ENUM('VALID', 'INVALID', 'RETRY') NOT NULL COMMENT 'Validation outcome',
  `rejection_reason` VARCHAR(100) COMMENT 'Rejection reason code if INVALID',
  `validation_time_ms` INT UNSIGNED COMMENT 'Time taken to validate in milliseconds',
  `http_status_code` INT COMMENT 'HTTP status code received during probing',
  `content_type` VARCHAR(255) COMMENT 'Content-Type header from the response',
  `redirect_chain` JSON COMMENT 'Array of redirect URLs if followed',
  `failed_rules` JSON COMMENT 'Array of rule keys that failed',
  `ip_address` VARCHAR(45) COMMENT 'IP address of the requester',
  `user_agent` VARCHAR(500) COMMENT 'User agent string',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_correlation_id` (`correlation_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_verdict` (`verdict`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_verdict` (`user_id`, `verdict`),
  CONSTRAINT `fk_url_validation_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log for all URL validation attempts';

-- ============================================================================
-- STEP 3: Seed Initial Configuration Rules
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
-- STEP 4: Create Rate Limiting Table for URL Validator
-- ============================================================================

CREATE TABLE IF NOT EXISTS `url_validator_rate_limits` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `identifier` VARCHAR(255) NOT NULL COMMENT 'user_id or IP address',
  `identifier_type` ENUM('USER', 'IP') NOT NULL,
  `request_count` INT UNSIGNED NOT NULL DEFAULT 1,
  `window_start` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_identifier_type_window` (`identifier`, `identifier_type`, `window_start`),
  KEY `idx_window_start` (`window_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Rate limiting tracking for URL validator API';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify configuration rules were created:
SELECT rule_key, enabled, description FROM url_validator_config ORDER BY rule_key;

-- Verify tables were created:
SHOW TABLES LIKE 'url_validator%';
