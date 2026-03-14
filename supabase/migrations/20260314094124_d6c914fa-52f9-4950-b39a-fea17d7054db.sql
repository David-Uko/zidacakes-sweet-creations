
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: admins can view all roles, users can view own
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- RLS: only admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: only admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create admin-only function to get all profiles
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
RETURNS TABLE(id UUID, full_name TEXT, phone_number TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.phone_number, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE public.has_role(auth.uid(), 'admin')
$$;

-- Create admin-only function to get all orders
CREATE OR REPLACE FUNCTION public.admin_get_all_orders()
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY created_at DESC
$$;

-- Create admin-only function to update order status
CREATE OR REPLACE FUNCTION public.admin_update_order_status(p_order_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.orders SET status = p_status, updated_at = now() WHERE id = p_order_id;
END;
$$;

-- Create admin function to get dashboard stats
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  SELECT json_build_object(
    'total_orders', (SELECT COUNT(*) FROM public.orders),
    'total_revenue', (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE payment_status = 'paid'),
    'pending_orders', (SELECT COUNT(*) FROM public.orders WHERE status = 'pending'),
    'total_members', (SELECT COUNT(*) FROM public.profiles),
    'total_custom_orders', (SELECT COUNT(*) FROM public.custom_orders),
    'monthly_orders', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT TO_CHAR(created_at, 'Mon') AS month, COUNT(*) AS count, COALESCE(SUM(total), 0) AS revenue
        FROM public.orders
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      ) t
    ),
    'recent_orders', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, customer_name, customer_email, total, status, payment_status, created_at
        FROM public.orders
        ORDER BY created_at DESC
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Admin function to get order items
CREATE OR REPLACE FUNCTION public.admin_get_order_items(p_order_id UUID)
RETURNS SETOF public.order_items
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.order_items
  WHERE order_id = p_order_id
    AND public.has_role(auth.uid(), 'admin')
$$;
