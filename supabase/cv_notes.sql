alter table profiles add column if not exists cv_notes jsonb default '{}'::jsonb;
