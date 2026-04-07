-- Migration: Timesheets, Team Invitations, and QBO IDs

-- 1. Modify team_members to support auth and QBO
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS qbo_employee_id TEXT,
ADD COLUMN IF NOT EXISTS qbo_employee_type TEXT CHECK (qbo_employee_type IN ('Employee', 'Vendor'));

-- 2. Create team_invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    team_member_id UUID REFERENCES public.team_members(id),
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- 3. Create time_entries table
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id), -- Admin who owns the entry
    team_member_id UUID NOT NULL REFERENCES public.team_members(id),
    proforma_id UUID REFERENCES public.proformas(id), -- Nullable for generic work
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'synced')),
    qb_time_activity_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Set up RLS for team_invitations
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage all their invitations
CREATE POLICY "Admins manage their team invitations" 
  ON public.team_invitations FOR ALL 
  USING (auth.uid() = admin_id);

-- Anyone can select an invitation by its token (so they can view it during signup)
CREATE POLICY "Public read invitations by token" 
  ON public.team_invitations FOR SELECT 
  USING (NOT used AND expires_at > NOW());

-- 5. Set up RLS for time_entries
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Admins can view/manage time_entries belonging to their account
CREATE POLICY "Admins manage their time_entries" 
  ON public.time_entries FOR ALL 
  USING (auth.uid() = user_id);

-- Team members can view/manage their OWN time_entries
CREATE POLICY "Team members manage own time_entries" 
  ON public.time_entries FOR ALL 
  USING (
    team_member_id IN (
      SELECT id FROM public.team_members WHERE auth_user_id = auth.uid()
    )
  );

-- Team members should also be able to read their own team_member row
DROP POLICY IF EXISTS "Team members can view own profile" ON public.team_members;
CREATE POLICY "Team members can view own profile"
  ON public.team_members FOR SELECT
  USING (auth.uid() = auth_user_id);
