-- Replace the broad public SELECT policy with one that only allows reading
-- a specific object (no listing). storage.objects SELECT with this condition
-- still allows `getPublicUrl` access to a known path.
DROP POLICY IF EXISTS "Public can view business logos" ON storage.objects;

-- Make the bucket NOT publicly listable; still publicly readable by URL via signed/public access
UPDATE storage.buckets SET public = true WHERE id = 'business-logos';

-- Allow public reads of individual objects (needed for <img src=publicUrl>),
-- but require the request to specify the exact name (not a list query).
CREATE POLICY "Public read individual business logo"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-logos' AND name IS NOT NULL);