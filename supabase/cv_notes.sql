alter table profiles add column if not exists cv_notes jsonb default '{}'::jsonb;

-- Workplace and hours are saved inside profiles.work_experience (already jsonb).
-- No extra column is required for remote/onsite or hours per day.
