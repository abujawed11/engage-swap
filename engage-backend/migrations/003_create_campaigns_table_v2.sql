-- Create campaigns table with public_id as regular column
CREATE TABLE campaigns (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  public_id VARCHAR(20) UNIQUE,
  user_id BIGINT NOT NULL,
  title VARCHAR(120) NOT NULL,
  url VARCHAR(512) NOT NULL,
  coins_per_visit INT NOT NULL CHECK (coins_per_visit >= 1),
  daily_cap INT NOT NULL CHECK (daily_cap >= 10),
  is_paused TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_paused (is_paused)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create trigger to auto-generate public_id after insert
DELIMITER $$
CREATE TRIGGER campaigns_after_insert
AFTER INSERT ON campaigns
FOR EACH ROW
BEGIN
  UPDATE campaigns
  SET public_id = CONCAT('CMP', LPAD(NEW.id, 4, '0'))
  WHERE id = NEW.id AND public_id IS NULL;
END$$
DELIMITER ;
