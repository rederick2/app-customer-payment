-- Add end_date to job_tasks
alter table public.job_tasks add column if not exists end_date timestamp with time zone;

-- Add team_member_id to job_time_entries
alter table public.job_time_entries add column if not exists team_member_id uuid references public.team_members(id) on delete set null;
