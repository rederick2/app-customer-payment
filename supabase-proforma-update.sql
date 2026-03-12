-- Update clients table
ALTER TABLE public.clients
ADD COLUMN company_name text;

-- Update proforma_items table
ALTER TABLE public.proforma_items
ADD COLUMN details text,
ADD COLUMN photo_url text;

-- Create bucket for proforma items photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('proforma-items', 'proforma-items', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the bucket
-- Allow public read access to the photos
CREATE POLICY "Public Read Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'proforma-items' );

-- Allow public insert access to the photos (for anonymous uploads during proforma creation)
CREATE POLICY "Public Insert Access"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'proforma-items' );

-- Allow public update access (optional, if they need to replace photos)
CREATE POLICY "Public Update Access"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'proforma-items' );
