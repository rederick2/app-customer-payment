-- Update users table with new fields for company profile
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS business_license text;

-- Create bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the bucket
-- Allow public read access to the logos
CREATE POLICY "Public Read Access Logos"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'company-logos' );

-- Allow public insert/update/delete access for authenticated users (owner)
CREATE POLICY "Authenticated User Access Logos"
  ON storage.objects FOR ALL
  USING ( bucket_id = 'company-logos' AND auth.role() = 'authenticated' )
  WITH CHECK ( bucket_id = 'company-logos' AND auth.role() = 'authenticated' );
