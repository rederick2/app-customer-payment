-- TABLE: user_integrations
-- =============================================
-- Stores OAuth tokens and configuration for external services (QuickBooks, Stripe, etc.)
-- =============================================

create table if not exists user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_name text not null, -- 'quickbooks', 'stripe'
  
  -- OAuth tokens (should be encrypted in production)
  access_token text,
  refresh_token text,
  realm_id text, -- Specifically for QuickBooks (Company ID)
  
  -- Expiration times
  expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  
  -- Metadata
  last_sync_at timestamptz,
  is_active boolean default true,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(user_id, service_name)
);

-- RLS
alter table user_integrations enable row level security;

create policy "Users can manage own integrations"
  on user_integrations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger to update updated_at
create or replace function update_user_integrations_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_user_integrations_updated_at
  before update on user_integrations
  for each row
  execute function update_user_integrations_updated_at();

-- Documentation:
-- TO ADD QUICKBOOKS:
-- 1. Obtain Client ID and Secret from Intuit Developer Portal.
-- 2. Add to .env.local:
--    QUICKBOOKS_CLIENT_ID=your_id
--    QUICKBOOKS_CLIENT_SECRET=your_secret
--    QUICKBOOKS_REDIRECT_URI=https://your-app.com/api/auth/quickbooks/callback
--    QUICKBOOKS_ENVIRONMENT=sandbox | production
