-- Migration 030: Add Snapshot Fields to Wallet Transactions Table
-- Captures campaign title at transaction time for audit trail integrity

-- Add snapshot field to wallet_transactions table
ALTER TABLE `wallet_transactions`
  ADD COLUMN `campaign_title_snapshot` VARCHAR(120) NULL COMMENT 'Campaign title captured at transaction time';

-- Backfill existing transactions with snapshot data from campaigns table (optional)
-- This helps maintain consistency for historical transactions
UPDATE `wallet_transactions` wt
INNER JOIN `campaigns` c ON wt.campaign_id = c.id
SET wt.campaign_title_snapshot = c.title
WHERE wt.campaign_id IS NOT NULL
  AND wt.campaign_title_snapshot IS NULL;

-- Note: Foreign key already set to ON DELETE SET NULL, which is correct
-- This allows transactions to remain even if campaign is deleted (hard delete in future)

-- Verification query
SELECT
  COUNT(*) as total_transactions,
  COUNT(campaign_id) as transactions_with_campaign,
  COUNT(campaign_title_snapshot) as transactions_with_snapshot,
  COUNT(CASE WHEN campaign_id IS NOT NULL AND campaign_title_snapshot IS NULL THEN 1 END) as missing_snapshots
FROM `wallet_transactions`;
