-- Add missing fields to ai_settings table for onboarding compatibility
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS ai_name TEXT DEFAULT 'Assistant',
ADD COLUMN IF NOT EXISTS response_style TEXT DEFAULT 'professional';