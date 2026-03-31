-- Add 'is_template' boolean to proformas
ALTER TABLE public.proformas 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false NOT NULL;

-- Make client_id nullable for templates
ALTER TABLE public.proformas 
ALTER COLUMN client_id DROP NOT NULL;

-- Enable fast searching/filtering for normal quotes vs templates
CREATE INDEX IF NOT EXISTS idx_proformas_is_template ON public.proformas(is_template);
