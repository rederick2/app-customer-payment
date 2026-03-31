-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  proforma_id UUID REFERENCES public.proformas(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- e.g., 'viewed', 'approved', 'rejected'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL
);

-- Add index for fast querying by user
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_proforma_id ON public.notifications(proforma_id);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Explicitly allow the service role (backend actions context) to insert
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- Enable Realtime for the notifications table
-- (WARNING: Sometimes publications are already named 'supabase_realtime'. Use the correct one.)
-- If realtime is not enabled, run the following:
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
