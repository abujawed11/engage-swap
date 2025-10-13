-- Create users table with simple public_id column
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  public_id VARCHAR(20) UNIQUE,
  username VARCHAR(32) NOT NULL,
  username_lower VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(191) NOT NULL,
  email_lower VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  coins INT NOT NULL DEFAULT 0,
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notes:
-- - public_id will be set by application code after insert
