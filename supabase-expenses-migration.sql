-- Create job_expenses table
create table public.job_expenses (
  id uuid default uuid_generate_v4() primary key,
  proforma_id uuid references public.proformas(id) on delete cascade not null,
  description text,
  place text,
  category text,
  amount numeric(10, 2) not null default 0,
  date date not null default current_date,
  image_url text,
  ocr_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.job_expenses enable row level security;

-- Create policy to allow all for now (matching project pattern or being simplified)
create policy "Allow all for authenticated users" on public.job_expenses
  for all using (true);
