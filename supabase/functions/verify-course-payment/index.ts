import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

    // Get user
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

    const { sessionId, courseId } = await req.json();

    // Verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Grant access - upsert so it works whether row exists or not
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

    // Get course for email
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("title, is_mentorship")
      .eq("id", courseId)
      .single();

    // Send confirmation email via EmailJS
    try {
      const emailjsServiceId = Deno.env.get("EMAILJS_SERVICE_ID");
      const emailjsTemplateId = Deno.env.get("EMAILJS_TEMPLATE_ID");
      const emailjsPublicKey = Deno.env.get("EMAILJS_PUBLIC_KEY");
      const emailjsPrivateKey = Deno.env.get("EMAILJS_PRIVATE_KEY");

      if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
        await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: emailjsServiceId,
            template_id: emailjsTemplateId,
            user_id: emailjsPublicKey,
            accessToken: emailjsPrivateKey,
            template_params: {
              to_email: user.email,
              to_name: user.user_metadata?.full_name || "Student",
              subject: `Course Enrolment Confirmed - ${course?.title}`,
              message: `Thank you for enrolling in "${course?.title}"! You can now access your course content from your dashboard.${
                course?.is_mentorship
                  ? "\n\nAs a mentorship student, you also have access to our private Telegram group. Visit your course page to find the join link."
                  : ""
              }`,
            },
          }),
        });
      }
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
    }

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
            message: `New course enrolment!\n\nCourse: ${course?.title}\nStudent: ${user.user_metadata?.full_name || "N/A"}\nEmail: ${user.email}\nPayment: Stripe\nMentorship: ${course?.is_mentorship ? "Yes" : "No"}`,
          }),
        });
      }
    } catch (w3fErr) {
      console.error("Web3Forms notification failed:", w3fErr);
    }

    return new Response(JSON.stringify({ success: true, courseName: course?.title }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Verify course payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});