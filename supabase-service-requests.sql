-- 1. Create the sequence/table for service requests
CREATE TABLE IF NOT EXISTS public.service_requests (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    proforma_id uuid NOT NULL REFERENCES public.proformas(id) ON DELETE CASCADE,
    details text NOT NULL,
    on_site_instructions text,
    schedule_date date,
    time_preference text CHECK (time_preference IN ('morning', 'afternoon', 'anytime')),
    images text[] DEFAULT ARRAY[]::text[],
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'scheduled', 'completed', 'cancelled')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- 2. Create the Storage bucket for request images
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-images', 'request-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies for the new bucket
-- Allow public insert access for anonymous form submissions
CREATE POLICY "Public request-images Insert Access"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'request-images' );

-- Allow public read access to display images back
CREATE POLICY "Public request-images Read Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'request-images' );

-- 4. Enable RLS on the new table
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- The company admins can read all request belonging to their proformas
CREATE POLICY "Users can view service requests for their proformas"
    ON public.service_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.proformas
            WHERE proformas.id = service_requests.proforma_id
            AND proformas.user_id = auth.uid()
        )
    );

-- Like proforma_requests, INSERT for clients will be handled by Server Actions 
-- utilizing the Service Role Key. We do not expose a public insert policy on the table directly 
-- to prevent potential abuse.
