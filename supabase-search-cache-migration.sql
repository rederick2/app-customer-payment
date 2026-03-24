-- ============================================================
-- Search Cache Table
-- Stores scraping results so the external API is only called once
-- per unique (store, query) pair.
-- ============================================================

create table public.material_search_cache (
  id         uuid default uuid_generate_v4() primary key,
  store      text not null,                        -- 'homedepot' | 'acehardware'
  query      text not null,                        -- normalized search term
  results    jsonb not null default '[]'::jsonb,   -- array of material objects
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null      -- created_at + 7 days
);

-- Unique constraint so upserts work cleanly
create unique index material_search_cache_store_query_idx
  on public.material_search_cache (store, query);

-- Index for fast expiry checks
create index material_search_cache_expires_at_idx
  on public.material_search_cache (expires_at);

-- Enable RLS (same pattern as rest of the project)
alter table public.material_search_cache enable row level security;

create policy "Allow all for authenticated users on material_search_cache"
  on public.material_search_cache
  for all using (true);
