-- ============================================================================
-- EngageSwap Wallet System Migration
-- ============================================================================
-- This migration creates the complete wallet system with:
-- 1. Wallets table (per-user balance tracking)
-- 2. Wallet Transactions table (immutable transaction history)
-- 3. Wallet Audit Logs table (administrative audit trail)
-- ============================================================================

USE `engage_swap`;

-- ─── Wallets Table ───────────────────────────────────────────────────────
-- Stores per-user wallet balances and aggregates
-- ─────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS `wallets`;

CREATE TABLE `wallets` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,

  -- Balance fields (DECIMAL(20,3) for precise 3-decimal coin representation)
  `available` DECIMAL(20,3) NOT NULL DEFAULT '0.000',
  `locked` DECIMAL(20,3) NOT NULL DEFAULT '0.000',

  -- Lifetime aggregates for transparency and analytics
  `lifetime_earned` DECIMAL(20,3) NOT NULL DEFAULT '0.000',
  `lifetime_spent` DECIMAL(20,3) NOT NULL DEFAULT '0.000',

  -- Timestamps
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_wallet` (`user_id`),

  -- Foreign key to users table
  CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,

  -- Constraints to ensure valid balances
  CONSTRAINT `chk_wallet_available` CHECK (`available` >= 0),
  CONSTRAINT `chk_wallet_locked` CHECK (`locked` >= 0),
  CONSTRAINT `chk_wallet_lifetime_earned` CHECK (`lifetime_earned` >= 0),
  CONSTRAINT `chk_wallet_lifetime_spent` CHECK (`lifetime_spent` >= 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX `idx_wallets_user_id` ON `wallets` (`user_id`);
CREATE INDEX `idx_wallets_updated_at` ON `wallets` (`updated_at`);


-- ─── Wallet Transactions Table ───────────────────────────────────────────
-- Immutable append-only ledger of all wallet transactions
-- ─────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS `wallet_transactions`;

CREATE TABLE `wallet_transactions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,

  -- Transaction type classification
  `type` ENUM('EARNED', 'SPENT', 'BONUS', 'REFUND', 'ADMIN_CREDIT', 'ADMIN_DEBIT') NOT NULL,

  -- Transaction status
  `status` ENUM('SUCCESS', 'PENDING', 'FAILED', 'REVERSED') NOT NULL DEFAULT 'SUCCESS',

  -- Amount and direction
  `amount` DECIMAL(20,3) NOT NULL,
  `sign` ENUM('PLUS', 'MINUS') NOT NULL,

  -- Source and campaign linkage
  `campaign_id` BIGINT DEFAULT NULL,
  `source` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,

  -- Idempotency key (prevents duplicate transactions)
  `reference_id` VARCHAR(128) COLLATE utf8mb4_unicode_ci NOT NULL,

  -- Metadata blob for contextual information (JSON)
  -- Can contain: quiz_results, time_watched, reward_split, admin_remarks, dispute_id, etc.
  `metadata` JSON DEFAULT NULL,

  -- Timestamps
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_reference_id` (`reference_id`),

  -- Foreign keys
  CONSTRAINT `wallet_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wallet_transactions_ibfk_2` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT `chk_txn_amount` CHECK (`amount` > 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance and filtering
CREATE INDEX `idx_txn_user_id` ON `wallet_transactions` (`user_id`);
CREATE INDEX `idx_txn_type` ON `wallet_transactions` (`type`);
CREATE INDEX `idx_txn_status` ON `wallet_transactions` (`status`);
CREATE INDEX `idx_txn_campaign_id` ON `wallet_transactions` (`campaign_id`);
CREATE INDEX `idx_txn_created_at` ON `wallet_transactions` (`created_at`);
CREATE INDEX `idx_txn_source` ON `wallet_transactions` (`source`);
CREATE INDEX `idx_txn_user_created` ON `wallet_transactions` (`user_id`, `created_at` DESC);
CREATE INDEX `idx_txn_user_type` ON `wallet_transactions` (`user_id`, `type`);
CREATE INDEX `idx_txn_user_status` ON `wallet_transactions` (`user_id`, `status`);


-- ─── Wallet Audit Logs Table ─────────────────────────────────────────────
-- Administrative audit trail for all wallet mutations
-- ─────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS `wallet_audit_logs`;

CREATE TABLE `wallet_audit_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,

  -- Actor information
  `actor_type` ENUM('SYSTEM', 'ADMIN') NOT NULL,
  `actor_id` BIGINT DEFAULT NULL, -- NULL if SYSTEM, otherwise admin user ID

  -- Target user
  `user_id` BIGINT NOT NULL,

  -- Action type
  `action` ENUM(
    'CREATE_TXN',
    'REVERSE_TXN',
    'ADJUST_BALANCE',
    'RECALC_AGGREGATES',
    'CREATE_WALLET',
    'LOCK_FUNDS',
    'UNLOCK_FUNDS'
  ) NOT NULL,

  -- Related transaction (if applicable)
  `txn_id` BIGINT DEFAULT NULL,

  -- Amount involved (if applicable)
  `amount` DECIMAL(20,3) DEFAULT NULL,

  -- Reason/notes for the action
  `reason` VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,

  -- Additional metadata (JSON)
  `metadata` JSON DEFAULT NULL,

  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  -- Foreign keys
  CONSTRAINT `wallet_audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wallet_audit_logs_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `wallet_audit_logs_ibfk_3` FOREIGN KEY (`txn_id`) REFERENCES `wallet_transactions` (`id`) ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for filtering and querying
CREATE INDEX `idx_audit_user_id` ON `wallet_audit_logs` (`user_id`);
CREATE INDEX `idx_audit_actor_type` ON `wallet_audit_logs` (`actor_type`);
CREATE INDEX `idx_audit_actor_id` ON `wallet_audit_logs` (`actor_id`);
CREATE INDEX `idx_audit_action` ON `wallet_audit_logs` (`action`);
CREATE INDEX `idx_audit_txn_id` ON `wallet_audit_logs` (`txn_id`);
CREATE INDEX `idx_audit_created_at` ON `wallet_audit_logs` (`created_at`);
CREATE INDEX `idx_audit_user_created` ON `wallet_audit_logs` (`user_id`, `created_at` DESC);


-- ─── Migration: Create Wallets for Existing Users ────────────────────────
-- Initialize wallets for all existing users with their current coin balance
-- ─────────────────────────────────────────────────────────────────────────

INSERT INTO `wallets` (`user_id`, `available`, `lifetime_earned`, `created_at`, `updated_at`)
SELECT
  `id` AS `user_id`,
  `coins` AS `available`,
  `coins` AS `lifetime_earned`, -- Assume current coins were all earned
  `created_at`,
  NOW()
FROM `users`
WHERE NOT EXISTS (
  SELECT 1 FROM `wallets` WHERE `wallets`.`user_id` = `users`.`id`
);

-- ─── Create Audit Log Entries for Migration ──────────────────────────────

INSERT INTO `wallet_audit_logs` (
  `actor_type`,
  `actor_id`,
  `user_id`,
  `action`,
  `amount`,
  `reason`,
  `created_at`
)
SELECT
  'SYSTEM' AS `actor_type`,
  NULL AS `actor_id`,
  `id` AS `user_id`,
  'CREATE_WALLET' AS `action`,
  `coins` AS `amount`,
  'Initial wallet creation during migration from legacy coins field' AS `reason`,
  NOW() AS `created_at`
FROM `users`
WHERE `coins` > 0;


-- ─── Success Message ──────────────────────────────────────────────────────

SELECT 'Wallet system migration completed successfully!' AS message;
SELECT COUNT(*) AS wallets_created FROM `wallets`;
SELECT COUNT(*) AS audit_logs_created FROM `wallet_audit_logs`;
