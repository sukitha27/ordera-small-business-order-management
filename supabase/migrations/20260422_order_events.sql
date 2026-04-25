-- =========================================
-- ORDER EVENTS AUDIT LOG
-- Records every meaningful change to an order (status, payment, courier, waybill).
-- Uses AFTER UPDATE triggers so events are captured unconditionally,
-- regardless of whether the change comes from the app, SQL editor, or future APIs.
-- =========================================

CREATE TABLE IF NOT EXISTS public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  -- event_type values:
  --   'created'           - order was inserted
  --   'status_changed'    - orders.status changed
  --   'payment_changed'   - orders.payment_status changed
  --   'courier_changed'   - orders.courier changed
  --   'waybill_changed'   - orders.waybill_number changed
  from_value text,
  to_value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Useful index for the timeline query (most recent first, per order)
CREATE INDEX IF NOT EXISTS idx_order_events_order_created
  ON public.order_events (order_id, created_at DESC);

-- Index for per-business audit queries
CREATE INDEX IF NOT EXISTS idx_order_events_business_created
  ON public.order_events (business_id, created_at DESC);

-- =========================================
-- RLS POLICIES
-- Match the existing multi-tenant pattern: users can only see events for their business.
-- =========================================
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view events for their business orders" ON public.order_events;
CREATE POLICY "Users can view events for their business orders"
  ON public.order_events
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- INSERT is not exposed to the client — only the triggers write events.
-- (SECURITY DEFINER on the trigger functions bypasses RLS for writes.)
-- UPDATE / DELETE on events is also not allowed: events are immutable.

-- =========================================
-- TRIGGER FUNCTION: log changes on UPDATE
-- =========================================
CREATE OR REPLACE FUNCTION public.log_order_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid;
BEGIN
  -- auth.uid() returns the user making the change (NULL if from the service_role or SQL editor)
  _actor := auth.uid();

  -- Status change
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_events
      (order_id, business_id, event_type, from_value, to_value, created_by)
    VALUES
      (NEW.id, NEW.business_id, 'status_changed', OLD.status::text, NEW.status::text, _actor);
  END IF;

  -- Payment status change
  IF TG_OP = 'UPDATE' AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO public.order_events
      (order_id, business_id, event_type, from_value, to_value, created_by)
    VALUES
      (NEW.id, NEW.business_id, 'payment_changed', OLD.payment_status::text, NEW.payment_status::text, _actor);
  END IF;

  -- Courier change (including assigning for the first time, or clearing)
  IF TG_OP = 'UPDATE' AND OLD.courier IS DISTINCT FROM NEW.courier THEN
    INSERT INTO public.order_events
      (order_id, business_id, event_type, from_value, to_value, created_by)
    VALUES
      (NEW.id, NEW.business_id, 'courier_changed', OLD.courier, NEW.courier, _actor);
  END IF;

  -- Waybill change
  IF TG_OP = 'UPDATE' AND OLD.waybill_number IS DISTINCT FROM NEW.waybill_number THEN
    INSERT INTO public.order_events
      (order_id, business_id, event_type, from_value, to_value, created_by)
    VALUES
      (NEW.id, NEW.business_id, 'waybill_changed', OLD.waybill_number, NEW.waybill_number, _actor);
  END IF;

  RETURN NEW;
END;
$$;

-- =========================================
-- TRIGGER FUNCTION: log 'created' event on INSERT
-- =========================================
CREATE OR REPLACE FUNCTION public.log_order_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.order_events
    (order_id, business_id, event_type, from_value, to_value, created_by)
  VALUES
    (NEW.id, NEW.business_id, 'created', NULL, NEW.status::text, auth.uid());

  RETURN NEW;
END;
$$;

-- =========================================
-- WIRE UP THE TRIGGERS
-- =========================================
DROP TRIGGER IF EXISTS trg_orders_log_update ON public.orders;
CREATE TRIGGER trg_orders_log_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_event();

DROP TRIGGER IF EXISTS trg_orders_log_insert ON public.orders;
CREATE TRIGGER trg_orders_log_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_created();

-- =========================================
-- BACKFILL: create a synthetic 'created' event for every existing order
-- that doesn't already have one, so the timeline isn't empty for old orders.
-- =========================================
INSERT INTO public.order_events (order_id, business_id, event_type, from_value, to_value, created_at, created_by)
SELECT o.id, o.business_id, 'created', NULL, o.status::text, o.created_at, NULL
FROM public.orders o
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_events e
  WHERE e.order_id = o.id AND e.event_type = 'created'
);
