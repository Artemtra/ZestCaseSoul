ALTER TABLE users
  MODIFY role ENUM('client', 'admin', 'executor') NOT NULL DEFAULT 'client';

ALTER TABLE user_case_designs
  ADD COLUMN IF NOT EXISTS payment_status ENUM('draft', 'paid') NOT NULL DEFAULT 'draft' AFTER design_state_json,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP NULL AFTER payment_status,
  ADD COLUMN IF NOT EXISTS production_status ENUM('new', 'in_work', 'shipped') NOT NULL DEFAULT 'new' AFTER paid_at,
  ADD COLUMN IF NOT EXISTS executor_photo_url VARCHAR(500) NULL AFTER production_status,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP NULL AFTER executor_photo_url;

CREATE INDEX IF NOT EXISTS idx_user_case_designs_payment_status ON user_case_designs (payment_status, production_status, created_at);
