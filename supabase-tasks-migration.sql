-- Create team_members table
create table if not exists public.team_members (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  role text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert some default members if needed (or leave empty for user to add)
insert into public.team_members (name, role)
values 
('Erick Santillan', 'Owner'),
('Staff Member', 'Technician')
on conflict do nothing;

-- Create job_tasks table
create table if not exists public.job_tasks (
  id uuid default uuid_generate_v4() primary key,
  proforma_id uuid references public.proformas(id) on delete cascade not null,
  proforma_item_id uuid references public.proforma_items(id) on delete set null,
  assigned_to uuid references public.team_members(id) on delete set null,
  title text not null,
  description text,
  due_date timestamp with time zone,
  status text not null default 'pending', -- pending, in-progress, completed
  google_event_id text,
  apple_event_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.team_members enable row level security;
alter table public.job_tasks enable row level security;

create policy "Enable all access for authenticated users on team_members"
on public.team_members for all
to authenticated
using (true)
with check (true);

create policy "Enable all access for authenticated users on job_tasks"
on public.job_tasks for all
to authenticated
using (true)
with check (true);
