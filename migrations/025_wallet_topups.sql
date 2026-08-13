CREATE TABLE IF NOT EXISTS wallet_topups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  topup_number VARCHAR(40) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'RUB',
  status ENUM('pending', 'succeeded', 'canceled', 'failed') NOT NULL DEFAULT 'pending',
  payment_provider VARCHAR(60) NOT NULL DEFAULT 'yookassa',
  payment_id VARCHAR(190) NULL,
  payment_idempotence_key VARCHAR(190) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  canceled_at TIMESTAMP NULL,
  CONSTRAINT fk_wallet_topups_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  UNIQUE KEY uq_wallet_topups_number (topup_number),
  UNIQUE KEY uq_wallet_topups_payment (payment_provider, payment_id),
  UNIQUE KEY uq_wallet_topups_idempotence (payment_idempotence_key),
  KEY idx_wallet_topups_user_status_created (user_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
