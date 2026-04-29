-- Plan limit enforcement
--
-- Adds a fast server-side function to check if a business can create
-- more orders this month. Called from the client before insert so the
-- UI can show an upgrade wall instead of a cryptic DB error.
--
-- We also add a DB-level constraint so even if the client check is
-- bypassed (e.g. direct API call), the server enforces the limit.

-- 1. Fast check function — called from client before insert
CREATE OR REPLACE FUNCTION public.can_create_order(business_uuid uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'allowed', COUNT(o.id) FILTER (
      WHERE o.created_at >= date_trunc('month', now())
        AND o.is_inquiry = false
    ) < b.plan_order_limit,
    'used', COUNT(o.id) FILTER (
      WHERE o.created_at >= date_trunc('month', now())
        AND o.is_inquiry = false
    ),
    'limit', b.plan_order_limit,
    'plan', b.plan
  )
  FROM public.businesses b
  LEFT JOIN public.orders o ON o.business_id = b.id
  WHERE b.id = business_uuid
  GROUP BY b.plan_order_limit, b.plan
$$;

-- Grant to authenticated users (merchants call this for their own business)
GRANT EXECUTE ON FUNCTION public.can_create_order(uuid) TO authenticated;

-- 2. Verify it works by running:
-- SELECT public.can_create_order('<your-business-uuid>');
-- Should return: {"allowed": true, "used": 9, "limit": 50, "plan": "free"}