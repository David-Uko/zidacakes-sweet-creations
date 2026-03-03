
ALTER TABLE public.custom_orders
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

CREATE OR REPLACE FUNCTION public.update_order_payment(
  p_stripe_session_id text,
  p_payment_intent_id text,
  p_payment_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.custom_orders
  SET stripe_payment_intent_id = p_payment_intent_id,
      payment_status = p_payment_status,
      status = CASE WHEN p_payment_status = 'paid' THEN 'confirmed' ELSE status END
  WHERE stripe_session_id = p_stripe_session_id;
END;
$$;
