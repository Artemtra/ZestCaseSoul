CREATE TABLE IF NOT EXISTS shop_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  purchases_enabled TINYINT(1) NOT NULL DEFAULT 1,
  disabled_message VARCHAR(320) NOT NULL,
  updated_by INT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_shop_settings_updated_by (updated_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO shop_settings (id, purchases_enabled, disabled_message)
VALUES (
  1,
  1,
  'Приём заказов временно приостановлен. Вы можете создать и сохранить дизайн — оформить покупку можно будет немного позже.'
)
ON DUPLICATE KEY UPDATE id = VALUES(id);
