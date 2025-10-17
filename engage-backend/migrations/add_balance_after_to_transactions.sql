-- ============================================================================
-- Add balance_after column to wallet_transactions
-- ============================================================================
-- This adds a snapshot of the user's available balance after each transaction
-- for better transaction history display
-- ============================================================================

USE `engage_swap`;

-- Add balance_after column (skip if already exists)
SET @columnExists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'engage_swap'
    AND TABLE_NAME = 'wallet_transactions'
    AND COLUMN_NAME = 'balance_after'
);

SET @sqlAddColumn := IF(
    @columnExists = 0,
    'ALTER TABLE `wallet_transactions` ADD COLUMN `balance_after` DECIMAL(20,3) DEFAULT NULL AFTER `sign`',
    'SELECT "Column balance_after already exists" AS message'
);

PREPARE stmt FROM @sqlAddColumn;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index (skip if already exists)
SET @indexExists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'engage_swap'
    AND TABLE_NAME = 'wallet_transactions'
    AND INDEX_NAME = 'idx_txn_balance_after'
);

SET @sqlAddIndex := IF(
    @indexExists = 0,
    'CREATE INDEX `idx_txn_balance_after` ON `wallet_transactions` (`balance_after`)',
    'SELECT "Index idx_txn_balance_after already exists" AS message'
);

PREPARE stmt FROM @sqlAddIndex;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill balance_after for existing transactions
-- Use a temporary table to avoid "can't update and select from same table" error

-- Create temporary table with calculated balances
DROP TEMPORARY TABLE IF EXISTS temp_balances;
CREATE TEMPORARY TABLE temp_balances AS
SELECT
    wt.id,
    wt.user_id,
    (
        w.available - COALESCE((
            SELECT SUM(
                CASE
                    WHEN wt2.sign = 'PLUS' THEN wt2.amount
                    ELSE -wt2.amount
                END
            )
            FROM wallet_transactions wt2
            WHERE wt2.user_id = wt.user_id
            AND wt2.status = 'SUCCESS'
            AND (
                wt2.created_at > wt.created_at
                OR (wt2.created_at = wt.created_at AND wt2.id > wt.id)
            )
        ), 0)
    ) AS calculated_balance
FROM wallet_transactions wt
INNER JOIN wallets w ON wt.user_id = w.user_id
WHERE wt.status = 'SUCCESS';

-- Update wallet_transactions with calculated balances
UPDATE wallet_transactions wt
INNER JOIN temp_balances tb ON wt.id = tb.id
SET wt.balance_after = tb.calculated_balance;

-- Clean up
DROP TEMPORARY TABLE IF EXISTS temp_balances;

-- Success message
SELECT 'Added balance_after column and backfilled existing transactions!' AS message;
