-- Add missing history tracking timestamps to proformas
ALTER TABLE public.proformas 
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS job_converted_at timestamp with time zone;
