-- Migration: Add campaign questions table
-- Store 5 questions per campaign with their configurations

CREATE TABLE campaign_questions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  campaign_id BIGINT NOT NULL,
  question_id INT NOT NULL,
  question_order INT NOT NULL,
  input_type VARCHAR(20) NOT NULL,
  config JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_campaign (campaign_id),
  CONSTRAINT chk_input_type CHECK (input_type IN ('dropdown', 'mcq', 'free_text')),
  CONSTRAINT chk_question_id CHECK (question_id >= 1 AND question_id <= 20),
  CONSTRAINT chk_question_order CHECK (question_order >= 1 AND question_order <= 5),
  UNIQUE KEY unique_campaign_question (campaign_id, question_id),
  UNIQUE KEY unique_campaign_order (campaign_id, question_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: config JSON structure by input_type:
--
-- dropdown/mcq:
--   {
--     "options": [
--       {"text": "Option 1", "is_correct": false},
--       {"text": "Option 2", "is_correct": true},
--       ...
--     ]
--   }
--
-- free_text:
--   {
--     "correct_answer": "Answer",
--     "synonyms": ["Synonym1", "Synonym2"]
--   }

-- Create table for storing quiz attempts (to enforce idempotency)
CREATE TABLE quiz_attempts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  visit_token VARCHAR(64) NOT NULL UNIQUE,
  campaign_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  correct_count INT NOT NULL,
  total_count INT NOT NULL DEFAULT 5,
  passed TINYINT(1) NOT NULL,
  multiplier DECIMAL(3,2) NOT NULL,
  reward_amount DECIMAL(20,3) NOT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_campaign (campaign_id),
  INDEX idx_user (user_id),
  INDEX idx_token (visit_token),
  CONSTRAINT chk_correct_count CHECK (correct_count >= 0 AND correct_count <= 5),
  CONSTRAINT chk_multiplier CHECK (multiplier >= 0.00 AND multiplier <= 1.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Quiz pass/reward rules:
-- - Pass threshold: correct_count >= 3
-- - Reward multipliers:
--   3/5 → 0.60 (60%)
--   4/5 → 0.80 (80%)
--   5/5 → 1.00 (100%)
-- - reward_amount = base_coins_per_visit × multiplier
-- - If failed (< 3), reward_amount = 0.000
