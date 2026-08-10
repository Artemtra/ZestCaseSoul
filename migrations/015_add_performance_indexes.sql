CREATE INDEX IF NOT EXISTS idx_phone_models_active_sort
  ON phone_models (is_active, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_case_templates_active_created_id
  ON case_templates (is_active, created_at, id);

CREATE INDEX IF NOT EXISTS idx_user_case_designs_user_created_id
  ON user_case_designs (user_id, created_at, id);

CREATE INDEX IF NOT EXISTS idx_user_case_designs_user_id
  ON user_case_designs (user_id, id);

CREATE INDEX IF NOT EXISTS idx_user_case_designs_admin_filters
  ON user_case_designs (user_id, phone_model_id, created_at, id);

CREATE INDEX IF NOT EXISTS idx_user_case_designs_executor_queue
  ON user_case_designs (payment_status, production_status, paid_at, id);
