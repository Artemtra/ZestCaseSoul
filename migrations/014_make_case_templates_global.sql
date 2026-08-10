UPDATE case_templates
SET phone_model_id = NULL
WHERE phone_model_id IS NOT NULL;
