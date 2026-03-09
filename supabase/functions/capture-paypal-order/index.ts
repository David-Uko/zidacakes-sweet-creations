import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

async function sendOrderNotifications(order: any, orderId: string, serviceRoleKey: string, supabaseUrl: string) {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_name, quantity, total_price")
    .eq("order_id", orderId);

  const itemsList = (orderItems || [])
    .map((i: any) => `${i.product_name} x${i.quantity} — £${Number(i.total_price).toFixed(2)}`)
    .join("\n");

  const totalQuantity = (orderItems || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
  const deliveryDateTime = `${order.delivery_date || "To be confirmed"}${order.delivery_time ? ` ${order.delivery_time}` : ""}`.trim();

  try {
    const customerEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-customer-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        templateParams: {
          to_email: order.customer_email,
          email: order.customer_email,
          customer_email: order.customer_email,
          customer_name: order.customer_name,
          name: order.customer_name,
          title: `Order Confirmation - ${orderId}`,
          order_id: orderId,
          product_ordered: itemsList || "Shop order",
          quantity: totalQuantity || 1,
          items_list: itemsList || "Shop order",
          cake_type: itemsList || "Shop order",
          cake_size: "N/A",
          cake_flavor: itemsList || "Shop order",
          cake_filling: "N/A",
          delivery_method: order.delivery_method,
          delivery_date: deliveryDateTime,
          delivery_address: order.delivery_address || (order.delivery_method === "pickup" ? "Pickup" : "Not provided"),
          special_requests: order.special_requests || "None",
          payment_method: "PayPal",
        },
      }),
    });

    if (!customerEmailResponse.ok) {
      console.error("Customer email failed:", await customerEmailResponse.text());
    }
  } catch (e) {
    console.error("Customer email failed:", e);
  }

  try {
    const adminEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        orderId,
        fullName: order.customer_name,
        email: order.customer_email,
        phoneNumber: order.customer_phone || "",
        size: "Shop Order",
        flavor: itemsList || "Various items",
        filling: "N/A",
        color: "N/A",
        deliveryMethod: order.delivery_method,
        deliveryDate: deliveryDateTime,
        notes:
          [
            order.delivery_address ? `Address: ${order.delivery_address}` : "",
            order.special_requests ? `Special requests: ${order.special_requests}` : "",
          ]
            .filter(Boolean)
            .join(" | ") || "None",
      }),
    });

    if (!adminEmailResponse.ok) {
      console.error("Admin notification failed:", await adminEmailResponse.text());
    }
  } catch (e) {
    console.error("Admin notification failed:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { paypalOrderId, orderId } = await req.json();
    if (!paypalOrderId) {
      return new Response(JSON.stringify({ error: "paypalOrderId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const orderLookup = orderId
      ? adminClient
          .from("orders")
          .select("id, user_id, payment_status, customer_email, customer_name, customer_phone, delivery_method, delivery_date, delivery_time, delivery_address, special_requests")
          .eq("id", orderId)
          .eq("user_id", user.id)
          .maybeSingle()
      : adminClient
          .from("orders")
          .select("id, user_id, payment_status, customer_email, customer_name, customer_phone, delivery_method, delivery_date, delivery_time, delivery_address, special_requests")
          .eq("paypal_order_id", paypalOrderId)
          .eq("user_id", user.id)
          .maybeSingle();

    const { data: existingOrder, error: existingOrderError } = await orderLookup;

    if (existingOrderError) {
      throw new Error(existingOrderError.message);
    }

    if (existingOrder?.payment_status === "paid") {
      return new Response(
        JSON.stringify({
          success: true,
          alreadyCaptured: true,
          orderId: existingOrder.id,
          paypalOrderId,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com";

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureRes.ok) {
      const text = await captureRes.text();
      throw new Error(`PayPal capture failed: ${text}`);
    }

    const captureData = await captureRes.json();
    if (captureData.status !== "COMPLETED") {
      throw new Error(`PayPal capture status ${captureData.status || "unknown"}`);
    }

    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const paymentId = capture?.id || paypalOrderId;
    const amount = Number(capture?.amount?.value || captureData.purchase_units?.[0]?.amount?.value || 0);
    const currency = capture?.amount?.currency_code || "USD";
    const resolvedOrderId =
      existingOrder?.id || orderId || captureData.purchase_units?.[0]?.custom_id || captureData.purchase_units?.[0]?.reference_id;

    if (!resolvedOrderId) {
      throw new Error("Could not resolve local order id for this PayPal payment");
    }

    const { data: updatedOrder, error: orderUpdateError } = await adminClient
      .from("orders")
      .update({
        paypal_order_id: paypalOrderId,
        payment_status: "paid",
        status: "confirmed",
      })
      .eq("id", resolvedOrderId)
      .eq("user_id", user.id)
      .select("id, customer_email, customer_name, customer_phone, delivery_method, delivery_date, delivery_time, delivery_address, special_requests")
      .single();

    if (orderUpdateError || !updatedOrder) {
      throw new Error(orderUpdateError?.message || "Order update failed");
    }

    const { error: paymentError } = await adminClient
      .from("payments")
      .upsert(
        {
          order_id: updatedOrder.id,
          user_id: user.id,
          provider: "paypal",
          provider_payment_id: paymentId,
          amount,
          currency,
          status: "paid",
          payment_payload: captureData,
        },
        { onConflict: "provider,provider_payment_id" }
      );

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    await sendOrderNotifications(updatedOrder, updatedOrder.id, serviceRoleKey, supabaseUrl);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: updatedOrder.id,
        paypalOrderId,
        paymentId,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("capture-paypal-order error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
