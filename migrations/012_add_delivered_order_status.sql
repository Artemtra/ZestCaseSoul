ALTER TABLE user_case_designs
  MODIFY production_status ENUM('new', 'in_work', 'shipped', 'delivered') NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP NULL AFTER shipped_at;
