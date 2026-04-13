import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function askAssistant(question: string) {
  const claudeApiKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!claudeApiKey) {
    return {
      response:
        "Thanks for your message — our support team will help shortly. Please share your order ID if your question is order-related.",
      needs_human_followup: true,
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${claudeApiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are the customer support assistant for Zidacakes'n'more. Answer clearly and politely in under 90 words. If the question needs human intervention, set needs_human_followup=true. Return strict JSON with keys: response (string), needs_human_followup (boolean).",
        },
        {
          role: "user",
          content: question,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed: ${text}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    return {
      response: "I couldn't generate a full answer, so I've flagged this for a human support follow-up.",
      needs_human_followup: true,
    };
  }

  try {
    const parsed = JSON.parse(content);
    return {
      response: String(parsed.response || "I’ve shared your message with our support team."),
      needs_human_followup: Boolean(parsed.needs_human_followup),
    };
  } catch {
    return {
      response: content,
      needs_human_followup: false,
    };
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

    const { message } = await req.json();
    const question = String(message || "").trim();

    if (!question) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    let response = "";
    let needsHumanFollowup = false;

    const orderIdMatch = question.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i);
    if (orderIdMatch && /order|status|delivery|payment/i.test(question)) {
      const { data: order } = await adminClient
        .from("orders")
        .select("id,status,payment_status,delivery_method,delivery_date,delivery_time")
        .eq("id", orderIdMatch[0])
        .eq("user_id", user.id)
        .maybeSingle();

      if (order) {
        response = `Order ${order.id} is currently ${order.status} with payment marked as ${order.payment_status}. Delivery method: ${order.delivery_method}. ${order.delivery_date ? `Scheduled for ${order.delivery_date}${order.delivery_time ? ` at ${order.delivery_time}` : ""}.` : "Delivery time is still being finalized."}`;
      }
    }

    if (!response) {
      const ai = await askAssistant(question);
      response = ai.response;
      needsHumanFollowup = ai.needs_human_followup;
    }

    const { error: supportInsertError } = await adminClient.from("support_messages").insert({
      user_id: user.id,
      customer_email: user.email,
      customer_name: (user.user_metadata?.full_name as string | undefined) || null,
      message: question,
      ai_response: response,
      requires_human_followup: needsHumanFollowup,
      status: needsHumanFollowup ? "open" : "resolved",
    });

    if (supportInsertError) {
      console.error("support_messages insert failed:", supportInsertError.message);
    }

    if (needsHumanFollowup) {
      const accessKey = Deno.env.get("WEB3FORMS_ACCESS_KEY");
      if (accessKey) {
        try {
          await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_key: accessKey,
              subject: `Support follow-up needed for ${user.email}`,
              from_name: "Zidacakes Support Widget",
              name: user.user_metadata?.full_name || user.email,
              email: user.email,
              message: `Customer question:\n${question}\n\nAssistant response:\n${response}`,
            }),
          });
        } catch (e) {
          console.error("Support follow-up email failed:", e);
        }
      }
    }

    return new Response(
      JSON.stringify({
        response,
        needsHumanFollowup,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("support-assistant error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
