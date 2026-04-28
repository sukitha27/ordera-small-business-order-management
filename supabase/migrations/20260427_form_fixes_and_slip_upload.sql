-- Public order form fixes + anonymous slip upload
--
-- Three things:
--   1. Relax the orders RLS to allow payment_status='pending_verification'
--      so customers can upload bank slips (which puts the order in
--      verification mode automatically).
--   2. Allow anonymous INSERT into payment_slips for inquiry orders of
--      public-form-enabled businesses.
--   3. Allow anonymous INSERT into payment-slips storage bucket for the
--      same scope.

-- 1. Update the orders insert policy to permit pending_verification ----

DROP POLICY IF EXISTS "orders_public_insert_inquiry" ON public.orders;
CREATE POLICY "orders_public_insert_inquiry"
  ON public.orders
  FOR INSERT
  TO anon
  WITH CHECK (
    is_inquiry = true
    AND inquiry_source IS NOT NULL
    AND status = 'pending'
    -- Customer can either pay later (unpaid for COD) or upload a slip
    -- (pending_verification for bank transfer). No way to set 'paid'.
    AND payment_status IN ('unpaid', 'pending_verification')
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = orders.business_id
        AND b.public_form_enabled = true
    )
  );


-- 2. Anonymous insert into payment_slips for public-form inquiries -----
--
-- Strict checks: the slip must be attached to an order that is itself
-- an inquiry from a public-form-enabled business. We don't allow anon
-- to set verified_at / verified_by / status='verified' — those are
-- merchant actions only.

DROP POLICY IF EXISTS "payment_slips_public_insert_for_inquiry" ON public.payment_slips;
CREATE POLICY "payment_slips_public_insert_for_inquiry"
  ON public.payment_slips
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Force initial status to be pending review by merchant
    status = 'pending'
    -- No anonymous user should be claiming verification credit
    AND verified_at IS NULL
    AND verified_by IS NULL
    AND uploaded_by IS NULL
    -- Order must be a valid inquiry from a public-form-enabled business
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.businesses b ON b.id = o.business_id
      WHERE o.id = payment_slips.order_id
        AND o.business_id = payment_slips.business_id
        AND o.is_inquiry = true
        AND b.public_form_enabled = true
    )
  );


-- 3. Anonymous storage policy for the payment-slips bucket -------------
--
-- The merchant's existing policies (Users can upload slips to their business)
-- check auth.uid() against businesses.user_id. We add a parallel anon
-- policy that requires the folder to belong to a public-form-enabled
-- business AND the path to follow {business_id}/inquiry-{...} naming
-- pattern (so we can identify anon-uploaded slips for safety/abuse handling).

DROP POLICY IF EXISTS "Anon can upload inquiry slips for public-enabled businesses"
  ON storage.objects;
CREATE POLICY "Anon can upload inquiry slips for public-enabled businesses"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'payment-slips'
    -- The first path segment must be a business_id of a public-form-enabled business
    AND (storage.foldername(name))[1] IN (
      SELECT id::text
      FROM public.businesses
      WHERE public_form_enabled = true
    )
    -- The path must include 'inquiry' segment so we can audit anon uploads.
    -- Forces clients to use {business_id}/inquiry-{order_id}-{...} format.
    AND name LIKE '%/inquiry-%'
  );

-- Allow anon to read their own just-uploaded slip via signed URL is unnecessary
-- because we're using public bucket reads. If your bucket is private (default),
-- the signed URL is generated server-side after upload — which the anon flow
-- doesn't actually need. We never show the slip back to the customer; we just
-- send it to the merchant.