INSERT INTO orders (
  order_number,
  user_id,
  status,
  payment_status,
  payment_provider,
  payment_id,
  products_amount,
  delivery_amount,
  discount_amount,
  total_amount,
  currency,
  recipient_name,
  recipient_phone,
  recipient_email,
  delivery_method,
  created_at,
  paid_at,
  production_started_at,
  shipped_at,
  delivered_at
)
SELECT
  CONCAT('LEGACY-DESIGN-', ucd.id) AS order_number,
  ucd.user_id,
  CASE
    WHEN ucd.production_status = 'delivered' THEN 'delivered'
    WHEN ucd.production_status = 'shipped' THEN 'shipped'
    ELSE 'paid'
  END AS status,
  'paid' AS payment_status,
  'legacy' AS payment_provider,
  CONCAT('legacy-design-', ucd.id) AS payment_id,
  COALESCE(pm.retail_price, 1990.00) AS products_amount,
  0.00 AS delivery_amount,
  0.00 AS discount_amount,
  COALESCE(pm.retail_price, 1990.00) AS total_amount,
  'RUB' AS currency,
  u.name AS recipient_name,
  'not-provided' AS recipient_phone,
  u.email AS recipient_email,
  'manual' AS delivery_method,
  ucd.created_at,
  COALESCE(ucd.paid_at, ucd.created_at) AS paid_at,
  CASE WHEN ucd.production_status IN ('in_work', 'shipped', 'delivered') THEN COALESCE(ucd.paid_at, ucd.created_at) ELSE NULL END AS production_started_at,
  ucd.shipped_at,
  ucd.delivered_at
FROM user_case_designs ucd
JOIN users u ON u.id = ucd.user_id
LEFT JOIN phone_models pm ON pm.id = ucd.phone_model_id
WHERE ucd.payment_status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.design_id = ucd.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM orders existing_order WHERE existing_order.order_number = CONCAT('LEGACY-DESIGN-', ucd.id)
  );

INSERT INTO order_items (
  order_id,
  design_id,
  phone_model_id,
  phone_model_name,
  supplier_sku,
  case_material,
  case_color,
  quantity,
  unit_price,
  total_price,
  source_file_url,
  preview_file_url,
  print_file_url,
  production_status,
  executor_photo_url,
  created_at
)
SELECT
  o.id,
  ucd.id,
  ucd.phone_model_id,
  COALESCE(pm.name, 'Модель не выбрана') AS phone_model_name,
  pm.supplier_sku,
  COALESCE(pm.case_material, 'TPU') AS case_material,
  COALESCE(pm.case_color, 'transparent') AS case_color,
  1 AS quantity,
  COALESCE(pm.retail_price, 1990.00) AS unit_price,
  COALESCE(pm.retail_price, 1990.00) AS total_price,
  NULL AS source_file_url,
  ucd.preview_with_camera_url,
  ucd.design_without_camera_url,
  CASE
    WHEN ucd.production_status IN ('shipped', 'delivered') THEN 'done'
    WHEN ucd.production_status = 'in_work' THEN 'in_work'
    ELSE 'new'
  END AS production_status,
  ucd.executor_photo_url,
  ucd.created_at
FROM user_case_designs ucd
JOIN orders o ON o.order_number = CONCAT('LEGACY-DESIGN-', ucd.id)
LEFT JOIN phone_models pm ON pm.id = ucd.phone_model_id
WHERE ucd.payment_status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.design_id = ucd.id
  );

INSERT INTO order_status_history (order_id, old_status, new_status, changed_by_user_id, comment, created_at)
SELECT
  o.id,
  NULL,
  o.status,
  NULL,
  'Перенесено из старых оплаченных дизайнов.',
  o.created_at
FROM orders o
WHERE o.payment_provider = 'legacy'
  AND NOT EXISTS (
    SELECT 1
    FROM order_status_history osh
    WHERE osh.order_id = o.id
      AND osh.comment = 'Перенесено из старых оплаченных дизайнов.'
  );
