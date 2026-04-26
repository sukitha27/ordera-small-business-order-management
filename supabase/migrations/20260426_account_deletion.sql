-- Account deletion: 30-day soft delete window
--
-- When a user requests deletion, we set deletion_scheduled_at on their
-- business row. They can log in during the 30-day window, see a banner
-- warning them, and cancel the deletion. After 30 days a cron job (the
-- purge-deleted-accounts edge function) hard-deletes them.
--
-- We use the `businesses` table for this (not auth.users) because:
--   - We control RLS on it
--   - We can read/write it from the client without service-role
--   - It's already 1:1 with the user

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS deletion_scheduled_at timestamptz;

-- Helper: businesses scheduled for purge
-- Used by the cron edge function to find which accounts to permanently delete.
-- Returns user_ids whose deletion_scheduled_at is older than 30 days ago.
CREATE OR REPLACE FUNCTION public.businesses_due_for_purge()
RETURNS TABLE (user_id uuid, business_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, id
  FROM public.businesses
  WHERE deletion_scheduled_at IS NOT NULL
    AND deletion_scheduled_at < now() - interval '30 days'
$$;

-- Restrict the helper so only service-role can call it (cron context).
-- Authenticated users have no business calling this directly.
REVOKE ALL ON FUNCTION public.businesses_due_for_purge() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.businesses_due_for_purge() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.businesses_due_for_purge() TO service_role;
