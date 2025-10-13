-- Add public_id generated column to visits table
-- Format: VIS0001, VIS0002, etc.

-- Check if column exists before adding
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'visits'
    AND COLUMN_NAME = 'public_id'
);

SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE visits ADD COLUMN public_id VARCHAR(20) AS (CONCAT(''VIS'', LPAD(id, 4, ''0''))) STORED UNIQUE AFTER id',
  'SELECT ''Column public_id already exists in visits table'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
