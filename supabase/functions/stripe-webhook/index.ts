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
        .select("id, payment_status, customer_email, customer_name, customer_phone, payment_method, delivery_method, delivery_date, delivery_time, delivery_address, special_requests")
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
          .select("product_name, quantity, total_price")
          .eq("order_id", orderId);

        const itemsList = (orderItems || []).map((i: any) => `${i.product_name} x${i.quantity} — $${Number(i.total_price).toFixed(2)}`).join("\n");
        const totalQuantity = (orderItems || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
        const deliveryDateTime = `${cartOrder.delivery_date || "To be confirmed"}${cartOrder.delivery_time ? ` ${cartOrder.delivery_time}` : ""}`.trim();

        // Send customer email
        try {
          const customerEmailResponse = await fetch(
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
                  email: cartOrder.customer_email,
                  customer_email: cartOrder.customer_email,
                  customer_name: cartOrder.customer_name,
                  name: cartOrder.customer_name,
                  title: `Order Confirmation - ${orderId}`,
                  order_id: orderId,
                  product_ordered: itemsList || "Shop order",
                  quantity: totalQuantity || 1,
                  items_list: itemsList || "Shop order",
                  cake_type: itemsList || "Shop order",
                  cake_size: "N/A",
                  cake_flavor: itemsList || "Shop order",
                  cake_filling: "N/A",
                  delivery_method: cartOrder.delivery_method,
                  delivery_date: deliveryDateTime,
                  delivery_address: cartOrder.delivery_address || (cartOrder.delivery_method === "pickup" ? "Pickup" : "Not provided"),
                  special_requests: cartOrder.special_requests || "None",
                  payment_method: cartOrder.payment_method || "stripe",
                },
              }),
            }
          );

          if (!customerEmailResponse.ok) {
            console.error("Customer email failed:", await customerEmailResponse.text());
          }
        } catch (e) {
          console.error("Customer email failed:", e);
        }

        // Send admin notification
        try {
          const adminNotificationResponse = await fetch(
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
                phoneNumber: cartOrder.customer_phone || "",
                size: "Shop Order",
                flavor: itemsList || "Various items",
                filling: "N/A",
                color: "N/A",
                deliveryMethod: cartOrder.delivery_method,
                deliveryDate: deliveryDateTime,
                notes: [
                  cartOrder.delivery_address ? `Address: ${cartOrder.delivery_address}` : "",
                  cartOrder.special_requests ? `Special requests: ${cartOrder.special_requests}` : "",
                ].filter(Boolean).join(" | ") || "None",
              }),
            }
          );

          if (!adminNotificationResponse.ok) {
            console.error("Admin notification failed:", await adminNotificationResponse.text());
          }
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
