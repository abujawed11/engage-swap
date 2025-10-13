-- Add public_id generated column to users table
-- Format: USR0001, USR0002, etc.

-- Check if column exists before adding
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'public_id'
);

SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE users ADD COLUMN public_id VARCHAR(20) AS (CONCAT(''USR'', LPAD(id, 4, ''0''))) STORED UNIQUE AFTER id',
  'SELECT ''Column public_id already exists in users table'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
