-- Create job_materials table
create table public.job_materials (
  id uuid default uuid_generate_v4() primary key,
  proforma_id uuid references public.proformas(id) on delete cascade not null,
  name text not null,
  description text,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(10, 2) not null default 0,
  total_price numeric(10, 2) not null default 0,
  photo_url text,
  product_url text,
  is_purchased boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.job_materials enable row level security;

-- Create policy to allow all for now (matching project pattern)
create policy "Allow all for authenticated users on job_materials" on public.job_materials
  for all using (true);
