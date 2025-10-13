-- Add email verification to users table
ALTER TABLE users
ADD COLUMN email_verified_at DATETIME NULL AFTER is_admin;

-- Create email_otps table for OTP verification
CREATE TABLE IF NOT EXISTS email_otps (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  attempts TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_expires_consumed (expires_at, consumed_at),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notes:
-- - email_verified_at tracks when user verified their email
-- - code_hash stores bcrypt hash of 6-digit OTP (never store plaintext)
-- - expires_at default: NOW() + 10 minutes
-- - consumed_at marks when OTP was successfully used
-- - attempts tracks failed verification attempts (max 5)
-- - Only one active (unexpired, unconsumed) OTP per user enforced by application logic
