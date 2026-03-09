const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Server-side product catalog — prevents price tampering
const PRODUCT_CATALOG: Record<string, { name: string; price: number }> = {
  "1": { name: "Rose Petal Wedding Cake", price: 189.99 },
  "2": { name: "Rainbow Sprinkle Birthday Cake", price: 59.99 },
  "3": { name: "Pink Ombré Custom Cake", price: 99.99 },
  "4": { name: "Classic Red Velvet Slice", price: 8.99 },
  "5": { name: "French Pastry Collection", price: 34.99 },
  "6": { name: "Chocolate Raspberry Mousse", price: 12.99 },
  "7": { name: "Pink Frosted Cupcake", price: 5.99 },
  "8": { name: "Luxury Celebration Cake", price: 129.99 },
};

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  const baseUrl = Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com";

  if (!clientId || !clientSecret) throw new Error("PayPal credentials not configured");

  const auth = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { orderId, items, shippingCost } = body;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing orderId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Cart is empty" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Calculate server-side total
    let total = 0;
    const ppItems: any[] = [];
    for (const item of items) {
      const product = PRODUCT_CATALOG[item.id];
      if (!product) {
        return new Response(
          JSON.stringify({ error: `Unknown product: ${item.id}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const qty = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
      const itemTotal = product.price * qty;
      total += itemTotal;
      ppItems.push({
        name: product.name,
        unit_amount: { currency_code: "GBP", value: product.price.toFixed(2) },
        quantity: String(qty),
      });
    }

    const shipping = Math.max(0, Number(shippingCost) || 0);
    total += shipping;

    const accessToken = await getPayPalAccessToken();
    const baseUrl = Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com";
    const originHeader = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const origin = originHeader
      ? originHeader
      : referer
        ? new URL(referer).origin
        : "https://localhost:5173";

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: orderId,
        custom_id: orderId,
        items: ppItems,
        amount: {
          currency_code: "GBP",
          value: total.toFixed(2),
          breakdown: {
            item_total: { currency_code: "GBP", value: (total - shipping).toFixed(2) },
            shipping: { currency_code: "GBP", value: shipping.toFixed(2) },
          },
        },
      }],
      application_context: {
        return_url: `${origin}/order-success?order_id=${encodeURIComponent(orderId)}`,
        cancel_url: `${origin}/checkout?canceled=true`,
        brand_name: "Zidacakes'n'more",
        user_action: "PAY_NOW",
      },
    };

    const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PayPal order creation failed: ${text}`);
    }

    const ppOrder = await res.json();
    const approveLink = ppOrder.links?.find((l: any) => l.rel === "approve");

    if (!approveLink) throw new Error("No PayPal approval link");

    const approvalUrl = approveLink.href;

    return new Response(
      JSON.stringify({ approvalUrl, paypalOrderId: ppOrder.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("PayPal order error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
