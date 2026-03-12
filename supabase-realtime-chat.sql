-- ====================================================
-- SUPABASE REALTIME + RLS + PRESENCE SETUP
-- Run this in your Supabase SQL Editor
-- ====================================================

-- 1. Enable Supabase Realtime on the proforma_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE public.proforma_requests;

-- 2. Add read_at column for read receipts
ALTER TABLE public.proforma_requests
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;

-- 3. Add a public SELECT policy so anonymous clients can subscribe to realtime
--    and read messages for a proforma they have the link to.
CREATE POLICY "Public can view messages for a proforma"
    ON public.proforma_requests FOR SELECT
    USING (true);

-- 4. Add a policy to allow updating read_at (for read receipts)
--    We allow updates only to the read_at column via the service role in our 
--    Server Actions, so no additional RLS policy is needed here.
--    (Our Next.js server actions use the service role which bypasses RLS)
