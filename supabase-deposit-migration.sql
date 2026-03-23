-- Add required_deposit to proformas table
ALTER TABLE public.proformas
ADD COLUMN IF NOT EXISTS required_deposit numeric(10, 2) DEFAULT 0;
