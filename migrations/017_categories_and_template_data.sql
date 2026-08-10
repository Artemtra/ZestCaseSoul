CREATE TABLE IF NOT EXISTS phone_model_categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  sort_order INT UNSIGNED NOT NULL DEFAULT 100,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS design_template_categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  sort_order INT UNSIGNED NOT NULL DEFAULT 100,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE phone_models
  ADD COLUMN IF NOT EXISTS category_id INT UNSIGNED NULL AFTER id;

ALTER TABLE case_templates
  ADD COLUMN IF NOT EXISTS category_id INT UNSIGNED NULL AFTER id,
  ADD COLUMN IF NOT EXISTS template_data JSON NULL AFTER image_url,
  ADD COLUMN IF NOT EXISTS preview_url VARCHAR(500) NULL AFTER template_data;

CREATE INDEX IF NOT EXISTS idx_phone_models_category_active
  ON phone_models (category_id, is_active, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_case_templates_category_active
  ON case_templates (category_id, is_active, created_at, id);

INSERT INTO phone_model_categories (name, slug, sort_order)
VALUES
  ('iPhone', 'iphone', 10),
  ('Samsung', 'samsung', 20),
  ('Xiaomi', 'xiaomi', 30),
  ('Redmi', 'redmi', 40),
  ('Poco', 'poco', 50),
  ('Honor', 'honor', 60),
  ('Huawei', 'huawei', 70),
  ('Realme', 'realme', 80),
  ('Tecno', 'tecno', 90),
  ('Infinix', 'infinix', 100),
  ('Другие', 'other', 1000)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  sort_order = VALUES(sort_order),
  is_active = 1;

INSERT INTO design_template_categories (name, slug, sort_order)
VALUES
  ('Аниме', 'anime', 10),
  ('Машины', 'cars', 20),
  ('Минимализм', 'minimalism', 30),
  ('Пары', 'couples', 40),
  ('Животные', 'animals', 50),
  ('Игры', 'games', 60),
  ('Надписи', 'text', 70),
  ('Абстракция', 'abstract', 80),
  ('Другие', 'other', 1000)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  sort_order = VALUES(sort_order),
  is_active = 1;

UPDATE phone_models pm
JOIN phone_model_categories c ON c.slug = CASE
  WHEN LOWER(pm.name) LIKE '%iphone%' THEN 'iphone'
  WHEN LOWER(pm.name) LIKE '%samsung%' OR LOWER(pm.name) LIKE '%galaxy%' THEN 'samsung'
  WHEN LOWER(pm.name) LIKE '%xiaomi%' THEN 'xiaomi'
  WHEN LOWER(pm.name) LIKE '%redmi%' THEN 'redmi'
  WHEN LOWER(pm.name) LIKE '%poco%' THEN 'poco'
  WHEN LOWER(pm.name) LIKE '%honor%' THEN 'honor'
  WHEN LOWER(pm.name) LIKE '%huawei%' THEN 'huawei'
  WHEN LOWER(pm.name) LIKE '%realme%' THEN 'realme'
  WHEN LOWER(pm.name) LIKE '%tecno%' THEN 'tecno'
  WHEN LOWER(pm.name) LIKE '%infinix%' THEN 'infinix'
  ELSE 'other'
END
SET pm.category_id = c.id
WHERE pm.category_id IS NULL;

UPDATE case_templates ct
JOIN design_template_categories c ON c.slug = CASE
  WHEN LOWER(ct.title) LIKE '%minimal%' OR LOWER(ct.title) LIKE '%минимал%' THEN 'minimalism'
  WHEN LOWER(ct.title) LIKE '%космос%' OR LOWER(ct.title) LIKE '%абстра%' THEN 'abstract'
  WHEN LOWER(ct.title) LIKE '%машин%' OR LOWER(ct.title) LIKE '%car%' THEN 'cars'
  WHEN LOWER(ct.title) LIKE '%аниме%' OR LOWER(ct.title) LIKE '%anime%' THEN 'anime'
  WHEN LOWER(ct.title) LIKE '%живот%' THEN 'animals'
  WHEN LOWER(ct.title) LIKE '%игр%' THEN 'games'
  WHEN LOWER(ct.title) LIKE '%надпис%' OR LOWER(ct.title) LIKE '%text%' THEN 'text'
  ELSE 'other'
END
SET ct.category_id = c.id,
    ct.preview_url = COALESCE(ct.preview_url, ct.image_url)
WHERE ct.category_id IS NULL;
