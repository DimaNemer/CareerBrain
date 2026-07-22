-- Migration: Add readiness score columns
ALTER TABLE public.user_skills 
ADD COLUMN IF NOT EXISTS proficiency_score integer,
ADD COLUMN IF NOT EXISTS evidence text;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS category_scores jsonb,
ADD COLUMN IF NOT EXISTS score_calculated_at timestamp with time zone;

ALTER TABLE public.cv_uploads 
ADD COLUMN IF NOT EXISTS processing_step text,
ADD COLUMN IF NOT EXISTS error_message text;
