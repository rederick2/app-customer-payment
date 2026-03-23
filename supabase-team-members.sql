-- Migration: Add user_id and hourly_cost to team_members

-- 1. Add columns to team_members
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS hourly_cost NUMERIC(10,2) DEFAULT 0;

-- 2. Bind existing team members to the active user (if you already created some, this auto-assigns them to you)
-- This assumes you are the primary user of the system.
UPDATE public.team_members 
SET user_id = (SELECT id FROM auth.users LIMIT 1) 
WHERE user_id IS NULL;

-- 3. Enable Row Level Security (RLS) safely
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 4. Create proper policies to isolate team members per user account
DROP POLICY IF EXISTS "Users can view their own team members" ON public.team_members;
CREATE POLICY "Users can view their own team members" 
  ON public.team_members FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own team members" ON public.team_members;
CREATE POLICY "Users can insert their own team members" 
  ON public.team_members FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own team members" ON public.team_members;
CREATE POLICY "Users can update their own team members" 
  ON public.team_members FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own team members" ON public.team_members;
CREATE POLICY "Users can delete their own team members" 
  ON public.team_members FOR DELETE 
  USING (auth.uid() = user_id);
