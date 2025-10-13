-- Create users table with public_id as regular column
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

-- Create trigger to auto-generate public_id after insert
DELIMITER $$
CREATE TRIGGER users_after_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  UPDATE users
  SET public_id = CONCAT('USR', LPAD(NEW.id, 4, '0'))
  WHERE id = NEW.id AND public_id IS NULL;
END$$
DELIMITER ;

-- Notes:
-- - username_lower and email_lower are canonical lowercase fields for case-insensitive uniqueness
-- - UNIQUE constraints on lowercase fields prevent duplicates regardless of case
-- - Original username and email fields preserve user's preferred casing for display
-- - public_id is auto-generated via trigger: USR0001, USR0002, etc.
