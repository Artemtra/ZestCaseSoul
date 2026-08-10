CREATE TABLE IF NOT EXISTS user_case_designs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  phone_model_id INT UNSIGNED NULL,
  title VARCHAR(160) NOT NULL,
  preview_with_camera_url VARCHAR(500) NOT NULL,
  design_without_camera_url VARCHAR(500) NOT NULL,
  source_images_json JSON NULL,
  design_state_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_case_designs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_case_designs_phone_model
    FOREIGN KEY (phone_model_id) REFERENCES phone_models(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_user_case_designs_user_created ON user_case_designs (user_id, created_at);
