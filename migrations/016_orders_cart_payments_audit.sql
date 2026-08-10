ALTER TABLE phone_models
  ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(120) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS supplier_sku VARCHAR(120) NULL AFTER logo,
  ADD COLUMN IF NOT EXISTS case_material VARCHAR(120) NOT NULL DEFAULT 'TPU' AFTER supplier_sku,
  ADD COLUMN IF NOT EXISTS case_color VARCHAR(80) NOT NULL DEFAULT 'transparent' AFTER case_material,
  ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER case_color,
  ADD COLUMN IF NOT EXISTS retail_price DECIMAL(10,2) NOT NULL DEFAULT 1990.00 AFTER purchase_price,
  ADD COLUMN IF NOT EXISTS old_price DECIMAL(10,2) NULL AFTER retail_price,
  ADD COLUMN IF NOT EXISTS production_days SMALLINT UNSIGNED NOT NULL DEFAULT 3 AFTER old_price,
  ADD COLUMN IF NOT EXISTS print_width_mm DECIMAL(8,2) NULL AFTER production_days,
  ADD COLUMN IF NOT EXISTS print_height_mm DECIMAL(8,2) NULL AFTER print_width_mm,
  ADD COLUMN IF NOT EXISTS print_dpi SMALLINT UNSIGNED NOT NULL DEFAULT 300 AFTER print_height_mm,
  ADD COLUMN IF NOT EXISTS print_bleed_mm DECIMAL(6,2) NOT NULL DEFAULT 2.00 AFTER print_dpi,
  ADD COLUMN IF NOT EXISTS safe_zone_mm DECIMAL(6,2) NOT NULL DEFAULT 4.00 AFTER print_bleed_mm;

CREATE TABLE IF NOT EXISTS carts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_carts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cart_id INT UNSIGNED NOT NULL,
  design_id INT UNSIGNED NOT NULL,
  phone_model_id INT UNSIGNED NOT NULL,
  case_material VARCHAR(120) NOT NULL DEFAULT 'TPU',
  case_color VARCHAR(80) NOT NULL DEFAULT 'transparent',
  quantity SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_items_cart
    FOREIGN KEY (cart_id) REFERENCES carts(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_design
    FOREIGN KEY (design_id) REFERENCES user_case_designs(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_phone_model
    FOREIGN KEY (phone_model_id) REFERENCES phone_models(id)
    ON DELETE RESTRICT,
  UNIQUE KEY uq_cart_items_design_variant (cart_id, design_id, case_material, case_color)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  status ENUM('new', 'paid', 'in_production', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'new',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_provider VARCHAR(60) NULL,
  payment_id VARCHAR(190) NULL,
  payment_idempotence_key VARCHAR(190) NULL,
  products_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  delivery_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'RUB',
  recipient_name VARCHAR(160) NOT NULL,
  recipient_phone VARCHAR(40) NOT NULL,
  recipient_email VARCHAR(190) NOT NULL,
  delivery_method VARCHAR(60) NOT NULL DEFAULT 'manual',
  delivery_provider VARCHAR(60) NULL,
  city VARCHAR(120) NULL,
  postal_code VARCHAR(40) NULL,
  address VARCHAR(500) NULL,
  cdek_pvz_code VARCHAR(120) NULL,
  cdek_pvz_address VARCHAR(500) NULL,
  tracking_number VARCHAR(120) NULL,
  assigned_executor_id INT UNSIGNED NULL,
  customer_comment TEXT NULL,
  admin_comment TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  production_started_at TIMESTAMP NULL,
  shipped_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_orders_executor
    FOREIGN KEY (assigned_executor_id) REFERENCES users(id)
    ON DELETE SET NULL,
  UNIQUE KEY uq_orders_payment_id (payment_provider, payment_id),
  KEY idx_orders_user_created (user_id, created_at),
  KEY idx_orders_status_created (status, payment_status, created_at),
  KEY idx_orders_executor (assigned_executor_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  design_id INT UNSIGNED NULL,
  phone_model_id INT UNSIGNED NULL,
  phone_model_name VARCHAR(160) NOT NULL,
  supplier_sku VARCHAR(120) NULL,
  case_material VARCHAR(120) NOT NULL,
  case_color VARCHAR(80) NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  source_file_url VARCHAR(500) NULL,
  preview_file_url VARCHAR(500) NULL,
  print_file_url VARCHAR(500) NULL,
  production_status ENUM('new', 'in_work', 'printed', 'done', 'rework') NOT NULL DEFAULT 'new',
  production_comment TEXT NULL,
  executor_photo_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_design
    FOREIGN KEY (design_id) REFERENCES user_case_designs(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_order_items_phone_model
    FOREIGN KEY (phone_model_id) REFERENCES phone_models(id)
    ON DELETE SET NULL,
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_design (design_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_status_history (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  old_status VARCHAR(60) NULL,
  new_status VARCHAR(60) NOT NULL,
  changed_by_user_id INT UNSIGNED NULL,
  comment TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_status_history_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_status_history_user
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  KEY idx_order_status_history_order (order_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_events (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(60) NOT NULL,
  external_event_id VARCHAR(190) NOT NULL,
  external_payment_id VARCHAR(190) NULL,
  event_type VARCHAR(120) NOT NULL,
  payload JSON NOT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payment_events_provider_event (provider, external_event_id),
  KEY idx_payment_events_payment (provider, external_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80) NULL,
  old_data JSON NULL,
  new_data JSON NULL,
  ip VARCHAR(80) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_audit_log_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  KEY idx_admin_audit_log_created (created_at),
  KEY idx_admin_audit_log_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
