import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      console.log("Session not paid yet, skipping");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const orderId = session.metadata?.order_id;
    const sessionId = session.id;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!orderId) {
      console.error("No order_id in session metadata");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Idempotency: check if already processed
    const { data: existing } = await supabase
      .from("custom_orders")
      .select("payment_status")
      .eq("id", orderId)
      .single();

    if (existing?.payment_status === "paid") {
      console.log("Order already marked as paid, skipping duplicate");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Update order
    const { error: updateError } = await supabase
      .from("custom_orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
        stripe_payment_intent_id: paymentIntentId || null,
        stripe_session_id: sessionId,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      return new Response("Database update failed", { status: 500 });
    }

    // Fetch full order for notifications
    const { data: order } = await supabase
      .from("custom_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (order) {
      // Send customer email via EmailJS
      try {
        const emailResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-customer-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              templateParams: {
                to_email: order.email,
                customer_name: order.full_name,
                order_id: order.id,
                cake_size: order.size,
                cake_flavor: order.flavor,
                cake_filling: order.filling,
                delivery_method: order.delivery_method,
                delivery_date: order.delivery_date || "To be confirmed",
              },
            }),
          }
        );
        await emailResponse.text();
      } catch (e) {
        console.error("Customer email failed:", e);
      }

      // Send admin notification via Web3Forms
      try {
        const adminResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              orderId: order.id,
              fullName: order.full_name,
              email: order.email,
              phoneNumber: order.phone_number,
              size: order.size,
              flavor: order.flavor,
              filling: order.filling,
              color: order.color,
              deliveryMethod: order.delivery_method,
              deliveryDate: order.delivery_date || "Not specified",
              notes: order.notes || "None",
            }),
          }
        );
        await adminResponse.text();
      } catch (e) {
        console.error("Admin notification failed:", e);
      }
    }

    console.log(`Order ${orderId} marked as paid successfully`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
