-- Add public_id column to users table using triggers
-- Format: USR0001, USR0002, etc.

-- Add the column if it doesn't exist
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'public_id'
);

SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE users ADD COLUMN public_id VARCHAR(20) UNIQUE AFTER id',
  'SELECT ''Column public_id already exists in users table'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create trigger to populate public_id on INSERT
DROP TRIGGER IF EXISTS users_public_id_insert;

DELIMITER $$
CREATE TRIGGER users_public_id_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  SET NEW.public_id = CONCAT('USR', LPAD(NEW.id, 4, '0'));
END$$
DELIMITER ;

-- Update existing records that don't have public_id
UPDATE users
SET public_id = CONCAT('USR', LPAD(id, 4, '0'))
WHERE public_id IS NULL;
