import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;

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
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed", status: session.payment_status }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      return new Response(JSON.stringify({ error: "No order_id in session metadata" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if already processed
    const { data: existingOrder } = await adminClient
      .from("orders")
      .select("id, payment_status, customer_email, customer_name, customer_phone, delivery_method, delivery_date, delivery_time, delivery_address, special_requests, payment_method")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (!existingOrder) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (existingOrder.payment_status === "paid") {
      return new Response(JSON.stringify({
        success: true,
        alreadyProcessed: true,
        orderId: existingOrder.id,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

    // Mark order as paid
    await adminClient
      .from("orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
        stripe_session_id: sessionId,
        stripe_payment_intent_id: paymentIntentId || null,
      })
      .eq("id", orderId);

    // Record payment
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    await adminClient.from("payments").upsert({
      order_id: orderId,
      user_id: user.id,
      provider: "stripe",
      provider_payment_id: paymentIntentId || sessionId,
      amount,
      currency: session.currency || "usd",
      status: "paid",
      payment_payload: session as any,
    }, { onConflict: "provider,provider_payment_id" });

    // Send notification emails
    const { data: orderItems } = await adminClient
      .from("order_items")
      .select("product_name, quantity, total_price")
      .eq("order_id", orderId);

    const itemsList = (orderItems || [])
      .map((i: any) => `${i.product_name} x${i.quantity} — $${Number(i.total_price).toFixed(2)}`)
      .join("\n");
    const totalQuantity = (orderItems || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
    const deliveryDateTime = `${existingOrder.delivery_date || "To be confirmed"}${existingOrder.delivery_time ? ` ${existingOrder.delivery_time}` : ""}`.trim();

    // Customer email via EmailJS
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-customer-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          templateParams: {
            to_email: existingOrder.customer_email,
            email: existingOrder.customer_email,
            customer_email: existingOrder.customer_email,
            customer_name: existingOrder.customer_name,
            name: existingOrder.customer_name,
            title: `Order Confirmation - ${orderId}`,
            order_id: orderId,
            product_ordered: itemsList || "Shop order",
            quantity: totalQuantity || 1,
            items_list: itemsList || "Shop order",
            cake_type: itemsList || "Shop order",
            cake_size: "N/A",
            cake_flavor: itemsList || "Shop order",
            cake_filling: "N/A",
            delivery_method: existingOrder.delivery_method,
            delivery_date: deliveryDateTime,
            delivery_address: existingOrder.delivery_address || (existingOrder.delivery_method === "pickup" ? "Pickup" : "Not provided"),
            special_requests: existingOrder.special_requests || "None",
            payment_method: "Stripe",
          },
        }),
      });
      if (!res.ok) console.error("Customer email failed:", await res.text());
    } catch (e) {
      console.error("Customer email failed:", e);
    }

    // Admin notification via Web3Forms
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          orderId,
          fullName: existingOrder.customer_name,
          email: existingOrder.customer_email,
          phoneNumber: existingOrder.customer_phone || "",
          size: "Shop Order",
          flavor: itemsList || "Various items",
          filling: "N/A",
          color: "N/A",
          deliveryMethod: existingOrder.delivery_method,
          deliveryDate: deliveryDateTime,
          notes: [
            existingOrder.delivery_address ? `Address: ${existingOrder.delivery_address}` : "",
            existingOrder.special_requests ? `Special requests: ${existingOrder.special_requests}` : "",
          ].filter(Boolean).join(" | ") || "None",
        }),
      });
      if (!res.ok) console.error("Admin notification failed:", await res.text());
    } catch (e) {
      console.error("Admin notification failed:", e);
    }

    return new Response(JSON.stringify({
      success: true,
      orderId,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("verify-stripe-payment error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
