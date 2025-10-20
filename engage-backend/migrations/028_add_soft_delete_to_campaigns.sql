-- Migration 028: Add Soft Delete to Campaigns
-- Enables soft delete functionality for campaigns to preserve historical data

-- Add soft delete fields to campaigns table
ALTER TABLE `campaigns`
  ADD COLUMN `deleted_at` DATETIME NULL COMMENT 'Timestamp when campaign was soft deleted',
  ADD COLUMN `deleted_by_user_id` BIGINT NULL COMMENT 'User ID who deleted the campaign',
  ADD COLUMN `deleted_reason` VARCHAR(255) NULL COMMENT 'Reason for deletion (user-initiated, admin, etc.)';

-- Add index for soft delete queries
ALTER TABLE `campaigns`
  ADD INDEX `idx_deleted_at` (`deleted_at`);

-- Add foreign key for deleted_by_user_id
ALTER TABLE `campaigns`
  ADD CONSTRAINT `fk_campaigns_deleted_by_user`
  FOREIGN KEY (`deleted_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Verification query
SELECT
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'engage_swap'
  AND TABLE_NAME = 'campaigns'
  AND COLUMN_NAME IN ('deleted_at', 'deleted_by_user_id', 'deleted_reason');
