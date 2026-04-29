-- Admin panel — tenant management columns
--
-- Adds subscription/plan management + suspension + admin notes to businesses.
-- All columns are admin-only writes: RLS on businesses already restricts
-- what the merchant themselves can update (they can only update their own
-- profile fields, not plan or suspension state).

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_order_limit integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_reason text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- Plan validation
ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_plan_check;
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_plan_check
  CHECK (plan IN ('free', 'starter', 'growth', 'business', 'custom'));

-- Defaults for existing rows (they're on free tier)
UPDATE public.businesses
  SET plan = 'free', plan_order_limit = 50
  WHERE plan IS NULL OR plan = '';

-- Index for admin queries filtering by plan + suspension
CREATE INDEX IF NOT EXISTS businesses_plan_idx ON public.businesses (plan);
CREATE INDEX IF NOT EXISTS businesses_suspended_idx ON public.businesses (is_suspended);

-- Helper view for admin: businesses with their order count this month.
-- Used by the Subscriptions tab to show current usage vs plan limit.
-- SECURITY DEFINER so admin can read across all tenants without RLS issues.
CREATE OR REPLACE VIEW public.admin_business_usage AS
SELECT
  b.id,
  b.business_name,
  b.owner_name,
  b.city,
  b.plan,
  b.plan_order_limit,
  b.trial_ends_at,
  b.is_suspended,
  b.suspended_reason,
  b.admin_notes,
  b.created_at,
  b.last_active_at,
  b.slug,
  b.public_form_enabled,
  b.deletion_scheduled_at,
  b.user_id,
  COUNT(o.id) FILTER (
    WHERE o.created_at >= date_trunc('month', now())
      AND o.is_inquiry = false
  ) AS orders_this_month,
  COUNT(o.id) FILTER (WHERE o.is_inquiry = false) AS orders_total,
  COALESCE(SUM(o.total) FILTER (WHERE o.is_inquiry = false), 0) AS revenue_total,
  MAX(o.created_at) FILTER (WHERE o.is_inquiry = false) AS last_order_at
FROM public.businesses b
LEFT JOIN public.orders o ON o.business_id = b.id
GROUP BY b.id;

-- Only service_role and authenticated admins should query this view.
-- The admin check happens in application code (useAuth isAdmin).
GRANT SELECT ON public.admin_business_usage TO authenticated;
GRANT SELECT ON public.admin_business_usage TO service_role;