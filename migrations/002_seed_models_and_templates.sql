INSERT INTO phone_models (id, name, slug, camera_type, case_width, case_height, corner_radius, color, logo, sort_order)
VALUES
  (1, 'iPhone 15 Pro Max', 'iphone-15-pro-max', 'iphone-pro', 330, 680, 56, '#d8d0c4', NULL, 10),
  (2, 'iPhone 15 / 15 Plus', 'iphone-15-15-plus', 'iphone-dual', 326, 668, 54, '#d9eef0', NULL, 20),
  (3, 'iPhone 14 Pro', 'iphone-14-pro', 'iphone-pro', 320, 660, 52, '#dfd7ef', NULL, 30),
  (4, 'iPhone 13', 'iphone-13', 'iphone-dual-diagonal', 318, 654, 50, '#f4d9d2', NULL, 40),
  (5, 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'samsung-ultra', 338, 690, 34, '#c9c5b8', NULL, 50),
  (6, 'Samsung Galaxy S24', 'samsung-galaxy-s24', 'samsung-line', 318, 660, 48, '#d9e5f5', NULL, 60),
  (7, 'Samsung Galaxy S24 FE', 'samsung-galaxy-s24-fe', 'samsung-s24-fe', 330, 690, 46, '#3a3a39', 'samsung', 70),
  (8, 'Samsung Galaxy A55', 'samsung-galaxy-a55', 'samsung-line', 330, 682, 46, '#e6e9ef', NULL, 80),
  (9, 'Xiaomi 14', 'xiaomi-14', 'xiaomi-square', 320, 662, 44, '#d7e1dc', NULL, 90),
  (10, 'Redmi Note 13 Pro', 'redmi-note-13-pro', 'redmi-panel', 334, 690, 44, '#d7d8e7', NULL, 100),
  (11, 'Google Pixel 8 Pro', 'google-pixel-8-pro', 'pixel-bar', 326, 676, 46, '#d8e2d6', NULL, 110),
  (12, 'Google Pixel 8', 'google-pixel-8', 'pixel-bar', 314, 650, 46, '#e3d7cf', NULL, 120),
  (13, 'OnePlus 12', 'oneplus-12', 'oneplus-circle', 328, 684, 48, '#d7eadb', NULL, 130)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  camera_type = VALUES(camera_type),
  case_width = VALUES(case_width),
  case_height = VALUES(case_height),
  corner_radius = VALUES(corner_radius),
  color = VALUES(color),
  logo = VALUES(logo),
  sort_order = VALUES(sort_order);

INSERT INTO case_templates (phone_model_id, title, image_url, original_filename, mime_type, file_size)
VALUES
  (7, 'Оранжевый вихрь', '/assets/templates/orange-wave.svg', 'orange-wave.svg', 'image/svg+xml', NULL),
  (6, 'Мятная волна', '/assets/templates/mint-wave.svg', 'mint-wave.svg', 'image/svg+xml', NULL),
  (1, 'Космос', '/assets/templates/cosmic.svg', 'cosmic.svg', 'image/svg+xml', NULL),
  (8, 'Песочный минимализм', '/assets/templates/sand-minimal.svg', 'sand-minimal.svg', 'image/svg+xml', NULL);
