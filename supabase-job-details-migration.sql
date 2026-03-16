-- Add cost to proforma_items
alter table public.proforma_items add column if not exists cost numeric(10, 2) default 0;

-- Create job_visits table
create table if not exists public.job_visits (
  id uuid default uuid_generate_v4() primary key,
  proforma_id uuid references public.proformas(id) on delete cascade not null,
  assigned_to uuid references auth.users(id),
  assigned_name text, -- Fallback for display
  visit_date timestamp with time zone not null,
  status text not null default 'scheduled', -- scheduled, completed, cancelled, overdue
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create job_time_entries table
create table if not exists public.job_time_entries (
  id uuid default uuid_generate_v4() primary key,
  proforma_id uuid references public.proformas(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  user_name text, -- Fallback for display
  duration text, -- e.g., "2h 30m"
  hours numeric(10, 2) default 0,
  minutes numeric(10, 2) default 0,
  start_time time,
  end_time time,
  hourly_rate numeric(10, 2) default 0,
  total_cost numeric(10, 2) default 0,
  date date not null default current_date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.job_visits enable row level security;
alter table public.job_time_entries enable row level security;

-- Policies (Allow authenticated users for now)
create policy "Allow all for authenticated users" on public.job_visits for all using (true);
create policy "Allow all for authenticated users" on public.job_time_entries for all using (true);
