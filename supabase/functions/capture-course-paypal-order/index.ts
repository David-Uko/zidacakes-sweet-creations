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

    const { paypalOrderId, courseId } = await req.json();

    if (!paypalOrderId || !courseId) {
      return new Response(JSON.stringify({ error: "Missing paypalOrderId or courseId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already paid
    const { data: existing } = await supabaseAdmin
      .from("user_courses")
      .select("id, payment_status")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing?.payment_status === "paid") {
      const { data: course } = await supabaseAdmin
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .single();

      return new Response(JSON.stringify({
        success: true,
        alreadyCaptured: true,
        courseName: course?.title || "your course",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Capture PayPal order
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
      throw new Error(`PayPal capture status: ${captureData.status || "unknown"}`);
    }

    // Grant access - upsert handles both new and existing rows
    const { error: upsertError } = await supabaseAdmin
      .from("user_courses")
      .upsert({
        user_id: user.id,
        course_id: courseId,
        payment_status: "paid",
      }, { onConflict: "user_id,course_id" });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      throw new Error("Failed to grant course access: " + upsertError.message);
    }

    // Get course name
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("title, is_mentorship")
      .eq("id", courseId)
      .single();

    // Send admin notification via Web3Forms
    try {
      const accessKey = Deno.env.get("WEB3FORMS_ACCESS_KEY");
      if (accessKey) {
        await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_key: accessKey,
            subject: `New Course Enrolment - ${course?.title}`,
            from_name: "Zidacakes'n'more Courses",
            name: user.user_metadata?.full_name || "Student",
            email: user.email,
            message: `New course enrolment!\n\nCourse: ${course?.title}\nStudent: ${
              user.user_metadata?.full_name || "N/A"
            }\nEmail: ${user.email}\nPayment: PayPal\nPayPal Order: ${paypalOrderId}\nMentorship: ${
              course?.is_mentorship ? "Yes" : "No"
            }`,
          }),
        });
      }
    } catch (w3fErr) {
      console.error("Web3Forms notification failed:", w3fErr);
    }

    return new Response(JSON.stringify({
      success: true,
      courseName: course?.title || "your course",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Capture course PayPal error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});