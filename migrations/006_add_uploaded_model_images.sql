ALTER TABLE phone_models
  ADD COLUMN IF NOT EXISTS phone_image_url VARCHAR(500) NULL AFTER logo,
  ADD COLUMN IF NOT EXISTS camera_image_url VARCHAR(500) NULL AFTER phone_image_url,
  ADD COLUMN IF NOT EXISTS camera_mask_url VARCHAR(500) NULL AFTER camera_image_url;
