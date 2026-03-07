import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

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

    // Update custom_orders if applicable
    if (orderId) {
      const { data: customOrder } = await supabase
        .from("custom_orders")
        .select("payment_status")
        .eq("id", orderId)
        .single();

      if (customOrder && customOrder.payment_status !== "paid") {
        await supabase
          .from("custom_orders")
          .update({
            payment_status: "paid",
            status: "confirmed",
            stripe_payment_intent_id: paymentIntentId || null,
            stripe_session_id: sessionId,
          })
          .eq("id", orderId);
      }
    }

    // Update orders table (cart orders)
    if (orderId) {
      const { data: cartOrder } = await supabase
        .from("orders")
        .select("id, payment_status, customer_email, customer_name, delivery_method, delivery_date, delivery_time, delivery_address, special_requests")
        .eq("id", orderId)
        .single();

      if (cartOrder && cartOrder.payment_status !== "paid") {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "confirmed",
            stripe_payment_intent_id: paymentIntentId || null,
            stripe_session_id: sessionId,
          })
          .eq("id", orderId);

        // Fetch order items
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId);

        const itemsList = (orderItems || []).map((i: any) => `${i.product_name} x${i.quantity} — $${i.total_price}`).join("\n");

        // Send customer email
        try {
          await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-customer-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                templateParams: {
                  to_email: cartOrder.customer_email,
                  customer_name: cartOrder.customer_name,
                  order_id: orderId,
                  cake_size: "N/A",
                  cake_flavor: itemsList || "Shop order",
                  cake_filling: "N/A",
                  delivery_method: cartOrder.delivery_method,
                  delivery_date: cartOrder.delivery_date || "To be confirmed",
                },
              }),
            }
          );
        } catch (e) {
          console.error("Customer email failed:", e);
        }

        // Send admin notification
        try {
          await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-notification`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                orderId,
                fullName: cartOrder.customer_name,
                email: cartOrder.customer_email,
                phoneNumber: "",
                size: "Shop Order",
                flavor: itemsList || "Various items",
                filling: "N/A",
                color: "N/A",
                deliveryMethod: cartOrder.delivery_method,
                deliveryDate: `${cartOrder.delivery_date || "Not specified"} ${cartOrder.delivery_time || ""}`.trim(),
                notes: [
                  cartOrder.delivery_address ? `Address: ${cartOrder.delivery_address}` : "",
                  cartOrder.special_requests ? `Special requests: ${cartOrder.special_requests}` : "",
                ].filter(Boolean).join(" | ") || "None",
              }),
            }
          );
        } catch (e) {
          console.error("Admin notification failed:", e);
        }
      }
    }

    console.log(`Order ${orderId} processed successfully`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
