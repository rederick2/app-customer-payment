-- Add job_type and recurring_interval columns to proformas
-- job_type: 'one-off' for single jobs, 'recurring' for repeating services
-- recurring_interval: how often the job repeats (only used when job_type = 'recurring')

ALTER TABLE public.proformas
  ADD COLUMN IF NOT EXISTS job_type text DEFAULT 'one-off'
    CHECK (job_type IN ('one-off', 'recurring')),
  ADD COLUMN IF NOT EXISTS recurring_interval text
    CHECK (recurring_interval IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly'));

COMMENT ON COLUMN public.proformas.job_type IS 'Type of job: one-off (single billing) or recurring (repeating service)';
COMMENT ON COLUMN public.proformas.recurring_interval IS 'How often the recurring job repeats: daily, weekly, biweekly, monthly, quarterly';
