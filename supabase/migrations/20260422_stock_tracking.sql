-- =========================================
-- STOCK AUTO-MANAGEMENT
-- Keeps products.stock in sync with order_items.
-- Cancelled orders do NOT consume stock (handled via orders status trigger).
-- =========================================

-- Helper: adjust stock for a given product by a delta (can be negative).
-- Uses explicit lock to prevent concurrent overselling.
CREATE OR REPLACE FUNCTION public.adjust_product_stock(_product_id uuid, _delta integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _product_id IS NULL OR _delta = 0 THEN
    RETURN;
  END IF;

  UPDATE public.products
  SET stock = stock + _delta
  WHERE id = _product_id;
END;
$$;

-- =========================================
-- TRIGGER: order_items changes
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_order_item_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order_status text;
BEGIN
  -- INSERT: decrement stock, but only if the parent order isn't cancelled
  IF TG_OP = 'INSERT' THEN
    IF NEW.product_id IS NOT NULL THEN
      SELECT status INTO _order_status FROM public.orders WHERE id = NEW.order_id;
      IF _order_status IS DISTINCT FROM 'cancelled' THEN
        PERFORM public.adjust_product_stock(NEW.product_id, -NEW.quantity);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- DELETE: restore stock, but only if the order wasn't cancelled
  -- (if cancelled, stock was already restored when status changed)
  IF TG_OP = 'DELETE' THEN
    IF OLD.product_id IS NOT NULL THEN
      SELECT status INTO _order_status FROM public.orders WHERE id = OLD.order_id;
      -- If order row is gone (CASCADE delete) _order_status is NULL: restore stock.
      -- If order still exists and is cancelled: stock was already restored, skip.
      IF _order_status IS NULL OR _order_status IS DISTINCT FROM 'cancelled' THEN
        PERFORM public.adjust_product_stock(OLD.product_id, OLD.quantity);
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE: adjust by delta (handles qty change and/or product swap)
  IF TG_OP = 'UPDATE' THEN
    SELECT status INTO _order_status FROM public.orders WHERE id = NEW.order_id;
    IF _order_status IS DISTINCT FROM 'cancelled' THEN
      -- Product changed: restore old, consume new
      IF OLD.product_id IS DISTINCT FROM NEW.product_id THEN
        IF OLD.product_id IS NOT NULL THEN
          PERFORM public.adjust_product_stock(OLD.product_id, OLD.quantity);
        END IF;
        IF NEW.product_id IS NOT NULL THEN
          PERFORM public.adjust_product_stock(NEW.product_id, -NEW.quantity);
        END IF;
      -- Same product, qty changed: adjust by delta
      ELSIF OLD.quantity <> NEW.quantity AND NEW.product_id IS NOT NULL THEN
        PERFORM public.adjust_product_stock(NEW.product_id, OLD.quantity - NEW.quantity);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_order_items_stock
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_item_stock();

-- =========================================
-- TRIGGER: order status changes
-- When an order moves to/from 'cancelled', restore/consume stock.
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_order_cancellation_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _item RECORD;
BEGIN
  -- Only run when status actually changed
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Transition INTO cancelled: restore stock for all items
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    FOR _item IN
      SELECT product_id, quantity
      FROM public.order_items
      WHERE order_id = NEW.id AND product_id IS NOT NULL
    LOOP
      PERFORM public.adjust_product_stock(_item.product_id, _item.quantity);
    END LOOP;
  END IF;

  -- Transition OUT of cancelled: re-consume stock for all items
  IF OLD.status = 'cancelled' AND NEW.status <> 'cancelled' THEN
    FOR _item IN
      SELECT product_id, quantity
      FROM public.order_items
      WHERE order_id = NEW.id AND product_id IS NOT NULL
    LOOP
      PERFORM public.adjust_product_stock(_item.product_id, -_item.quantity);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_cancellation_stock
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_cancellation_stock();

-- =========================================
-- BACKFILL: reconcile existing stock with already-created orders.
-- For every order_item linked to a product in a non-cancelled order,
-- decrement stock accordingly. Run this ONCE.
-- =========================================
DO $$
DECLARE
  _item RECORD;
BEGIN
  FOR _item IN
    SELECT oi.product_id, SUM(oi.quantity) AS total_qty
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.product_id IS NOT NULL
      AND o.status <> 'cancelled'
    GROUP BY oi.product_id
  LOOP
    UPDATE public.products
    SET stock = stock - _item.total_qty
    WHERE id = _item.product_id;
  END LOOP;
END $$;
