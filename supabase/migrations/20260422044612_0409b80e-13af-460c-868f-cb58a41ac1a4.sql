
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- user_roles policies
CREATE POLICY "Users view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-wide visibility on businesses
CREATE POLICY "Admins view all businesses"
ON public.businesses FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all businesses"
ON public.businesses FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete all businesses"
ON public.businesses FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Admin visibility on related tables (read-only for oversight)
CREATE POLICY "Admins view all customers"
ON public.customers FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all products"
ON public.products FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all orders"
ON public.orders FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all order items"
ON public.order_items FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
