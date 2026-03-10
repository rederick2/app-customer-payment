-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create clients table
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create proformas table
create table public.proformas (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  project_name text not null,
  valid_until date not null,
  subtotal numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create proforma items table
create table public.proforma_items (
  id uuid default uuid_generate_v4() primary key,
  proforma_id uuid references public.proformas(id) on delete cascade not null,
  description text not null,
  quantity integer not null default 1,
  unit_price numeric(10, 2) not null default 0,
  total_price numeric(10, 2) not null default 0
);
