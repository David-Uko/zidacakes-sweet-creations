import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { courseId } = await req.json();

    // Get course details
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return new Response(JSON.stringify({ error: "Course not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already purchased
    const { data: existing } = await supabaseAdmin
      .from("user_courses")
      .select("id, payment_status")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing?.payment_status === "paid") {
      return new Response(JSON.stringify({ error: "Already purchased" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "https://zidacakes-sweet-creations.vercel.app";
    const price = Number(course.price);

    const accessToken = await getPayPalAccessToken();
    const baseUrl = Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com";

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [{
        custom_id: `course_${courseId}_${user.id}`,
        items: [{
          name: course.title,
          unit_amount: { currency_code: "GBP", value: price.toFixed(2) },
          quantity: "1",
        }],
        amount: {
          currency_code: "GBP",
          value: price.toFixed(2),
          breakdown: {
            item_total: { currency_code: "GBP", value: price.toFixed(2) },
          },
        },
      }],
      application_context: {
        return_url: `${origin}/course-success?paypal=true&course_id=${courseId}`,
        cancel_url: `${origin}/courses`,
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

    // Upsert user_courses with pending status so row exists before capture
    const { error: upsertError } = await supabaseAdmin
      .from("user_courses")
      .upsert({
        user_id: user.id,
        course_id: courseId,
        paypal_order_id: ppOrder.id,
        payment_status: "pending",
      }, { onConflict: "user_id,course_id" });

    if (upsertError) {
      console.error("Upsert pending error:", upsertError);
    }

    return new Response(JSON.stringify({ approvalUrl: approveLink.href, paypalOrderId: ppOrder.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Course PayPal order error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



