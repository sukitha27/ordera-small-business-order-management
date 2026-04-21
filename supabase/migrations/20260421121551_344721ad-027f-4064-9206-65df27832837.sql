-- =========================================
-- BUSINESSES (tenant) TABLE
-- =========================================
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT 'My Business',
  owner_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  logo_url TEXT,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','si')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own business"
  ON public.businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners update own business"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners insert own business"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =========================================
-- HELPER: get current user's business id
-- =========================================
CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.businesses WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =========================================
-- TIMESTAMP TRIGGER
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- AUTO-CREATE BUSINESS ON SIGNUP
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.businesses (user_id, business_name, owner_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
    COALESCE(NEW.raw_user_meta_data->>'owner_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- PRODUCTS
-- =========================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_business ON public.products(business_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business views own products"
  ON public.products FOR SELECT
  USING (business_id = public.current_business_id());

CREATE POLICY "Business inserts own products"
  ON public.products FOR INSERT
  WITH CHECK (business_id = public.current_business_id());

CREATE POLICY "Business updates own products"
  ON public.products FOR UPDATE
  USING (business_id = public.current_business_id());

CREATE POLICY "Business deletes own products"
  ON public.products FOR DELETE
  USING (business_id = public.current_business_id());

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- CUSTOMERS
-- =========================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_business ON public.customers(business_id);
CREATE INDEX idx_customers_phone ON public.customers(business_id, phone);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business views own customers"
  ON public.customers FOR SELECT
  USING (business_id = public.current_business_id());

CREATE POLICY "Business inserts own customers"
  ON public.customers FOR INSERT
  WITH CHECK (business_id = public.current_business_id());

CREATE POLICY "Business updates own customers"
  ON public.customers FOR UPDATE
  USING (business_id = public.current_business_id());

CREATE POLICY "Business deletes own customers"
  ON public.customers FOR DELETE
  USING (business_id = public.current_business_id());

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- ORDERS
-- =========================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  customer_city TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','packed','shipped','delivered','cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'cod'
    CHECK (payment_method IN ('cod','bank_transfer','cash')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','paid','refunded')),
  courier TEXT,
  waybill_number TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, order_number)
);

CREATE INDEX idx_orders_business ON public.orders(business_id);
CREATE INDEX idx_orders_status ON public.orders(business_id, status);
CREATE INDEX idx_orders_created ON public.orders(business_id, created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business views own orders"
  ON public.orders FOR SELECT
  USING (business_id = public.current_business_id());

CREATE POLICY "Business inserts own orders"
  ON public.orders FOR INSERT
  WITH CHECK (business_id = public.current_business_id());

CREATE POLICY "Business updates own orders"
  ON public.orders FOR UPDATE
  USING (business_id = public.current_business_id());

CREATE POLICY "Business deletes own orders"
  ON public.orders FOR DELETE
  USING (business_id = public.current_business_id());

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- ORDER ITEMS
-- =========================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_business ON public.order_items(business_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business views own order items"
  ON public.order_items FOR SELECT
  USING (business_id = public.current_business_id());

CREATE POLICY "Business inserts own order items"
  ON public.order_items FOR INSERT
  WITH CHECK (business_id = public.current_business_id());

CREATE POLICY "Business updates own order items"
  ON public.order_items FOR UPDATE
  USING (business_id = public.current_business_id());

CREATE POLICY "Business deletes own order items"
  ON public.order_items FOR DELETE
  USING (business_id = public.current_business_id());

-- =========================================
-- STORAGE: business logos
-- =========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true);

CREATE POLICY "Public can view business logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-logos');

CREATE POLICY "Users upload own business logo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'business-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own business logo"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'business-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own business logo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'business-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );