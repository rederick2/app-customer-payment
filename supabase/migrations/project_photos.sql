-- Run this in your Supabase SQL Editor
-- =============================================
-- TABLE: project_photos
-- =============================================
create table if not exists project_photos (
  id uuid primary key default gen_random_uuid(),
  proforma_id uuid references proformas(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  storage_path text not null,
  url text not null,
  caption text,
  overlay_text text,
  tags text[] default '{}',
  is_public boolean not null default false,
  taken_at timestamptz default now(),
  created_at timestamptz default now()
);

-- RLS
alter table project_photos enable row level security;

create policy "Users can manage own photos"
  on project_photos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public photos are visible to all"
  on project_photos for select
  using (is_public = true);

-- =============================================
-- STORAGE BUCKET: project-photos
-- =============================================
insert into storage.buckets (id, name, public)
values ('project-photos', 'project-photos', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-photos');

create policy "Authenticated users can delete own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public read project-photos"
  on storage.objects for select
  using (bucket_id = 'project-photos');
