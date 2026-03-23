-- Add signature tracking fields for Proformas
ALTER TABLE public.proformas 
ADD COLUMN IF NOT EXISTS client_signature_data text,
ADD COLUMN IF NOT EXISTS client_signed_name text;
