-- Add public_id generated column to campaigns table
-- Format: CMP0001, CMP0002, etc.

-- Check if column exists before adding
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'campaigns'
    AND COLUMN_NAME = 'public_id'
);

SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE campaigns ADD COLUMN public_id VARCHAR(20) AS (CONCAT(''CMP'', LPAD(id, 4, ''0''))) STORED UNIQUE AFTER id',
  'SELECT ''Column public_id already exists in campaigns table'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
