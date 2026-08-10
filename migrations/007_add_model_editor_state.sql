ALTER TABLE phone_models
  ADD COLUMN IF NOT EXISTS camera_work_url VARCHAR(500) NULL AFTER camera_mask_url,
  ADD COLUMN IF NOT EXISTS camera_editor_state JSON NULL AFTER camera_work_url;
