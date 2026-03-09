import Stripe from "npm:stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Server-side product catalog with prices (cents) — prevents price tampering
const PRODUCT_CATALOG: Record<string, { name: string; priceCents: number }> = {
  "1": { name: "Rose Petal Wedding Cake", priceCents: 18999 },
  "2": { name: "Rainbow Sprinkle Birthday Cake", priceCents: 5999 },
  "3": { name: "Pink Ombré Custom Cake", priceCents: 9999 },
  "4": { name: "Classic Red Velvet Slice", priceCents: 899 },
  "5": { name: "French Pastry Collection", priceCents: 3499 },
  "6": { name: "Chocolate Raspberry Mousse", priceCents: 1299 },
  "7": { name: "Pink Frosted Cupcake", priceCents: 599 },
  "8": { name: "Luxury Celebration Cake", priceCents: 12999 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    const { items, customerEmail, orderId, shippingCost } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Cart is empty" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build line items from server-side catalog
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const item of items) {
      const product = PRODUCT_CATALOG[item.id];
      if (!product) {
        return new Response(
          JSON.stringify({ error: `Unknown product: ${item.id}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const quantity = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: { name: product.name },
          unit_amount: product.priceCents,
        },
        quantity,
      });
    }

    // Add shipping if applicable
    if (shippingCost && shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: { name: "Shipping (Postage)" },
          unit_amount: shippingCost,
        },
        quantity: 1,
      });
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
    const origin = req.headers.get("origin") || req.headers.get("referer") || "https://localhost:5173";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=true`,
      metadata: orderId ? { order_id: orderId } : undefined,
    };

    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Cart checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
