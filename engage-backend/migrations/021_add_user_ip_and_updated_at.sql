-- Migration: Add ip_address and updated_at to users table
-- Description: Track user IP addresses and last update time

ALTER TABLE `users`
ADD COLUMN `ip_address` VARCHAR(45) NULL AFTER `email_verified_at`,
ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Add index for IP address lookups
CREATE INDEX `idx_ip_address` ON `users` (`ip_address`);
