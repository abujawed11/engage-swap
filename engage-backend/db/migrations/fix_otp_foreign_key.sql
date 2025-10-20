-- Migration: Fix OTP foreign key constraint to support pending users
-- Issue: email_otps.user_id references users.id, but during signup we need to store OTP for pending_users
-- Solution: Create a separate table for pending user OTPs

-- Create pending_user_otps table for OTPs during registration
CREATE TABLE IF NOT EXISTS `pending_user_otps` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pending_user_id` bigint unsigned NOT NULL,
  `code_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `purpose` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'email_verification',
  `attempts` tinyint NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pending_user_id` (`pending_user_id`),
  KEY `idx_expires_consumed` (`expires_at`,`consumed_at`),
  KEY `idx_purpose` (`purpose`),
  CONSTRAINT `pending_user_otps_ibfk_1` FOREIGN KEY (`pending_user_id`) REFERENCES `pending_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
