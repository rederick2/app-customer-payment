-- ============================================================
-- Task Media Table
-- Stores FTP-uploaded photos/videos for completed tasks
-- ============================================================

create table public.task_media (
  id          uuid default uuid_generate_v4() primary key,
  task_id     uuid references public.job_tasks(id) on delete cascade not null,
  proforma_id uuid references public.proformas(id) on delete cascade not null,
  url         text not null,                   -- Public FTP URL
  type        text not null default 'image',   -- 'image' | 'video'
  caption     text,
  created_at  timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Fast lookup by task and by proforma (public page)
create index task_media_task_id_idx     on public.task_media (task_id);
create index task_media_proforma_id_idx on public.task_media (proforma_id);

-- Enable RLS (same pattern as rest of project)
alter table public.task_media enable row level security;

create policy "Allow all for authenticated users on task_media"
  on public.task_media
  for all using (true);
