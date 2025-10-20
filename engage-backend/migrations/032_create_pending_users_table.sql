-- Migration 032: Create pending_users table for OTP verification flow
-- This table temporarily stores user data until email is verified

CREATE TABLE IF NOT EXISTS `pending_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(32) NOT NULL,
  `username_lower` VARCHAR(32) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `email_lower` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  UNIQUE KEY `idx_pending_username_lower` (`username_lower`),
  UNIQUE KEY `idx_pending_email_lower` (`email_lower`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment
ALTER TABLE `pending_users` COMMENT = 'Temporarily stores user registration data until email verification';
