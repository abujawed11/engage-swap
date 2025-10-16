-- Migration: Add is_disabled field to users table
-- Description: Allow admins to disable user accounts without deleting them

ALTER TABLE `users`
ADD COLUMN `is_disabled` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_admin`;

-- Add index for faster queries
CREATE INDEX `idx_is_disabled` ON `users` (`is_disabled`);

-- Add disabled_at timestamp for tracking
ALTER TABLE `users`
ADD COLUMN `disabled_at` DATETIME NULL AFTER `is_disabled`;

-- Add disabled_reason for admin notes
ALTER TABLE `users`
ADD COLUMN `disabled_reason` VARCHAR(255) NULL AFTER `disabled_at`;
