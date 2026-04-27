-- Public Order Form — feature migration
--
-- Lets merchants share a public URL like /order/{slug} where customers
-- can place orders without logging in. Submitted orders go into the
-- merchant's inquiries inbox for review/confirmation.
--
-- Three pieces:
--   1. Slug + enable flag on businesses (public switch + URL identifier)
--   2. Inquiry markers on orders (is_inquiry, inquiry_source)
--   3. RLS policies that allow anonymous access ONLY when explicitly enabled

-- 1. Businesses table additions ---------------------------------------------

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS public_form_enabled boolean NOT NULL DEFAULT false;

-- Slugs are kebab-case, ASCII letters/digits/hyphens only, 3-60 chars
-- We let app code generate + validate; this constraint is a final safety net.
ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_slug_format;
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_slug_format
  CHECK (slug IS NULL OR (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 60));

CREATE INDEX IF NOT EXISTS businesses_slug_idx
  ON public.businesses (slug)
  WHERE slug IS NOT NULL;


-- 2. Orders table additions -------------------------------------------------

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_inquiry boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inquiry_source text;

CREATE INDEX IF NOT EXISTS orders_inquiry_idx
  ON public.orders (business_id, is_inquiry)
  WHERE is_inquiry = true;


-- 3. RLS policies for anonymous access --------------------------------------

-- 3a. Anonymous users can READ a business row IFF the merchant enabled the
--     public form. They can only see the columns they need (handled at app layer
--     by selecting only the fields we expose).
DROP POLICY IF EXISTS "businesses_public_read_when_enabled" ON public.businesses;
CREATE POLICY "businesses_public_read_when_enabled"
  ON public.businesses
  FOR SELECT
  TO anon
  USING (public_form_enabled = true);

-- 3b. Anonymous users can READ active products of a public-form-enabled business.
--     This is what powers the product list on the public form.
DROP POLICY IF EXISTS "products_public_read_when_form_enabled" ON public.products;
CREATE POLICY "products_public_read_when_form_enabled"
  ON public.products
  FOR SELECT
  TO anon
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = products.business_id
        AND b.public_form_enabled = true
    )
  );

-- 3c. Anonymous users can INSERT orders, but only if:
--     - The target business has public_form_enabled = true
--     - The order is marked is_inquiry = true (forces inquiry bucket)
--     - The order has inquiry_source set (audit trail)
--     - Status is 'pending' (no slipping in 'paid' or 'shipped')
--     - Payment status is 'unpaid'
--
-- This is the most security-sensitive policy in the app. Anonymous users
-- get write access to a real table, so we lock down everything we can.
DROP POLICY IF EXISTS "orders_public_insert_inquiry" ON public.orders;
CREATE POLICY "orders_public_insert_inquiry"
  ON public.orders
  FOR INSERT
  TO anon
  WITH CHECK (
    is_inquiry = true
    AND inquiry_source IS NOT NULL
    AND status = 'pending'
    AND payment_status = 'unpaid'
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = orders.business_id
        AND b.public_form_enabled = true
    )
  );

-- 3d. Anonymous users can INSERT order_items but only attached to an
--     inquiry order they just inserted (matched by order_id) and only for
--     a public-form-enabled business.
DROP POLICY IF EXISTS "order_items_public_insert_for_inquiry" ON public.order_items;
CREATE POLICY "order_items_public_insert_for_inquiry"
  ON public.order_items
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.businesses b ON b.id = o.business_id
      WHERE o.id = order_items.order_id
        AND o.business_id = order_items.business_id
        AND o.is_inquiry = true
        AND b.public_form_enabled = true
    )
  );

-- 3e. Anonymous users do NOT get SELECT on orders or order_items — they can
--     only insert. This prevents fishing for other customers' orders by
--     guessing UUIDs. The form just shows a success toast, no order detail.
--
-- (No SELECT policy created for anon role on orders / order_items.)


-- 4. Helper for slug uniqueness check (used during signup auto-generation) -

CREATE OR REPLACE FUNCTION public.slug_is_available(check_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.businesses WHERE slug = check_slug
  );
$$;

GRANT EXECUTE ON FUNCTION public.slug_is_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.slug_is_available(text) TO anon;