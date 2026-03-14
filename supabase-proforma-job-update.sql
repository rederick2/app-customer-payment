-- Add 'job' status to proformas and scheduling columns
DO $$ 
BEGIN
    -- Update the CHECK constraint for status
    ALTER TABLE public.proformas DROP CONSTRAINT IF EXISTS proformas_status_check;
    ALTER TABLE public.proformas ADD CONSTRAINT proformas_status_check 
        CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'job'));

    -- Add scheduling columns
    ALTER TABLE public.proformas ADD COLUMN IF NOT EXISTS job_start_at TIMESTAMPTZ;
    ALTER TABLE public.proformas ADD COLUMN IF NOT EXISTS job_end_at TIMESTAMPTZ;
END $$;
