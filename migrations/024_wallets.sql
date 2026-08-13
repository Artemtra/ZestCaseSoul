ALTER TABLE users
  ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER role;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS wallet_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER discount_amount,
  ADD COLUMN IF NOT EXISTS external_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER wallet_amount,
  ADD COLUMN IF NOT EXISTS wallet_payment_status ENUM('none', 'reserved', 'captured', 'released') NOT NULL DEFAULT 'none' AFTER payment_status;

UPDATE orders
SET external_amount = total_amount
WHERE external_amount = 0.00
  AND wallet_amount = 0.00
  AND total_amount > 0.00;

CREATE TABLE IF NOT EXISTS wallet_reservations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'captured', 'released') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  settled_at TIMESTAMP NULL,
  CONSTRAINT fk_wallet_reservations_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_wallet_reservations_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_wallet_reservations_order (order_id),
  KEY idx_wallet_reservations_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED NULL,
  created_by_user_id INT UNSIGNED NULL,
  direction ENUM('credit', 'debit') NOT NULL,
  kind VARCHAR(40) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  idempotency_key VARCHAR(190) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_transactions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_wallet_transactions_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_wallet_transactions_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  UNIQUE KEY uq_wallet_transactions_idempotency (idempotency_key),
  KEY idx_wallet_transactions_user_created (user_id, created_at),
  KEY idx_wallet_transactions_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
