-- Create visit verification tokens table
-- Tokens are short-lived (1-2 min) and single-use
CREATE TABLE visit_tokens (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  token VARCHAR(64) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  campaign_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires (expires_at),
  INDEX idx_user_campaign (user_id, campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create visits table to track verified visits with public_id
CREATE TABLE visits (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  public_id VARCHAR(20) UNIQUE,
  user_id BIGINT NOT NULL,
  campaign_id BIGINT NOT NULL,
  campaign_owner_id BIGINT NOT NULL,
  coins_earned INT NOT NULL,
  visited_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visit_date DATE NOT NULL, -- For daily cap tracking

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_campaign (campaign_id),
  INDEX idx_campaign_date (campaign_id, visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create trigger to auto-generate public_id after insert
DELIMITER $$
CREATE TRIGGER visits_after_insert
AFTER INSERT ON visits
FOR EACH ROW
BEGIN
  UPDATE visits
  SET public_id = CONCAT('VIS', LPAD(NEW.id, 4, '0'))
  WHERE id = NEW.id AND public_id IS NULL;
END$$
DELIMITER ;
