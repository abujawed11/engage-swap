-- ============================================================================
-- Add purpose column to email_otps table for password reset functionality
-- ============================================================================

USE `engage_swap`;

-- Add purpose column to email_otps table
ALTER TABLE `email_otps`
ADD COLUMN `purpose` VARCHAR(50) NOT NULL DEFAULT 'email_verification'
  AFTER `consumed_at`;

-- Add index on purpose for faster lookups
CREATE INDEX `idx_purpose` ON `email_otps` (`purpose`);

-- Success message
SELECT 'OTP purpose column added successfully!' AS message;
