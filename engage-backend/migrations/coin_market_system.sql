-- ============================================================================
-- EngageSwap Coin Market System Migration
-- ============================================================================
-- Creates tables for coin pack marketplace with dual-currency support (INR/USD)
-- and "Coming Soon" state management
-- ============================================================================

USE `engage_swap`;

-- ─── Coin Packs Table ────────────────────────────────────────────────────
-- Stores purchasable coin packages with pricing in both INR and USD
-- ─────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS `coin_packs`;

CREATE TABLE `coin_packs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,

  -- Pack identification
  `tier_name` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,

  -- Coin calculations (DECIMAL(20,3) for consistency with wallet system)
  `base_coins` DECIMAL(20,3) NOT NULL,
  `bonus_percent` DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  -- total_coins = base_coins * (1 + bonus_percent/100) - calculated on the fly

  -- Pricing in dual currencies
  `price_inr` DECIMAL(12,2) NOT NULL,
  `price_usd` DECIMAL(12,2) NOT NULL,

  -- Display and marketing flags
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_popular` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `display_order` INT NOT NULL DEFAULT 0,

  -- Metadata
  `description` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `badge_text` VARCHAR(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL, -- e.g., "Best Value", "Most Popular"

  -- Timestamps
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tier_name` (`tier_name`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_display_order` (`display_order`),
  KEY `idx_is_featured` (`is_featured`),

  -- Constraints
  CONSTRAINT `chk_pack_base_coins` CHECK (`base_coins` > 0),
  CONSTRAINT `chk_pack_bonus_percent` CHECK (`bonus_percent` >= 0 AND `bonus_percent` <= 100),
  CONSTRAINT `chk_pack_price_inr` CHECK (`price_inr` > 0),
  CONSTRAINT `chk_pack_price_usd` CHECK (`price_usd` > 0),
  CONSTRAINT `chk_pack_display_order` CHECK (`display_order` >= 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX `idx_active_order` ON `coin_packs` (`is_active`, `display_order`);


-- ─── Market Settings Table ────────────────────────────────────────────────
-- Global settings for coin market behavior
-- ─────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS `market_settings`;

CREATE TABLE `market_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,

  -- Checkout control
  `is_checkout_enabled` TINYINT(1) NOT NULL DEFAULT 0, -- FALSE = "Coming Soon" mode

  -- Display messages
  `banner_message` VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coming_soon_message` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Payments are being finalized. Coming soon!',
  `footer_note` VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT 'Prices are subject to change. All taxes included.',

  -- FX hint (display-only, not used for actual conversion)
  `fx_hint_usd_to_inr` DECIMAL(12,4) DEFAULT 83.5000,

  -- Feature flags
  `show_effective_price` TINYINT(1) NOT NULL DEFAULT 1,
  `show_bonus_breakdown` TINYINT(1) NOT NULL DEFAULT 1,

  -- Timestamps
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── Seed Data: Coin Packs ───────────────────────────────────────────────
-- Insert the 6 starter packs as specified
-- ─────────────────────────────────────────────────────────────────────────

INSERT INTO `coin_packs`
  (`tier_name`, `base_coins`, `bonus_percent`, `price_inr`, `price_usd`, `is_featured`, `is_popular`, `display_order`, `badge_text`)
VALUES
  ('Starter', 100.000, 0.00, 49.00, 0.99, 0, 0, 1, NULL),
  ('Explorer', 250.000, 10.00, 109.00, 1.99, 0, 1, 2, 'Most Popular'),
  ('Growth', 500.000, 15.00, 199.00, 3.99, 0, 0, 3, NULL),
  ('Pro', 1000.000, 20.00, 349.00, 6.99, 1, 0, 4, 'Best Value'),
  ('Power User', 2500.000, 25.00, 799.00, 14.99, 0, 0, 5, NULL),
  ('Business', 5000.000, 30.00, 1399.00, 24.99, 0, 0, 6, NULL);


-- ─── Seed Data: Market Settings ──────────────────────────────────────────
-- Initialize with "Coming Soon" mode enabled
-- ─────────────────────────────────────────────────────────────────────────

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


-- ─── Success Message ──────────────────────────────────────────────────────

SELECT 'Coin Market system migration completed successfully!' AS message;
SELECT COUNT(*) AS packs_created FROM `coin_packs`;
SELECT `is_checkout_enabled` AS checkout_status FROM `market_settings` WHERE id = 1;
