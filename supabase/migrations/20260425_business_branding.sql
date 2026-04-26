-- Branding: business logo support
-- Adds a logo_url column to businesses + creates a 'business-assets' storage
-- bucket scoped per business via RLS. The bucket is private; the app uses
-- short-lived signed URLs to display logos. Folder convention: {business_id}/logo/*

-- 1. Add logo_url column to businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS logo_url text;

-- 2. Create storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-assets',
  'business-assets',
  false,
  2 * 1024 * 1024,  -- 2 MB cap (compressed logos are well under this)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS policies — each merchant only manages their own business_id folder
DROP POLICY IF EXISTS "Users can read their own business assets" ON storage.objects;
CREATE POLICY "Users can read their own business assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.businesses WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can upload to their own business folder" ON storage.objects;
CREATE POLICY "Users can upload to their own business folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.businesses WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own business assets" ON storage.objects;
CREATE POLICY "Users can update their own business assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.businesses WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own business assets" ON storage.objects;
CREATE POLICY "Users can delete their own business assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'business-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.businesses WHERE user_id = auth.uid()
    )
  );
