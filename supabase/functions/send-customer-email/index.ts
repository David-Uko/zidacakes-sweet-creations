const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const pickString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payloadBody = await req.json();
    const rawTemplateParams = (payloadBody?.templateParams ?? {}) as Record<string, unknown>;

    const serviceId = Deno.env.get("EMAILJS_SERVICE_ID");
    const templateId = Deno.env.get("EMAILJS_TEMPLATE_ID");
    const publicKey = Deno.env.get("EMAILJS_PUBLIC_KEY");
    const privateKey = Deno.env.get("EMAILJS_PRIVATE_KEY");

    if (!serviceId || !templateId || !publicKey) {
      throw new Error("EmailJS configuration missing");
    }

    const recipient = pickString(
      rawTemplateParams.to_email,
      rawTemplateParams.customer_email,
      rawTemplateParams.email,
    );

    if (!recipient) {
      throw new Error("Missing customer recipient email in template params");
    }

    const customerName = pickString(rawTemplateParams.customer_name, rawTemplateParams.name) ?? "Customer";

    const normalizedTemplateParams: Record<string, unknown> = {
      ...rawTemplateParams,
      to_email: recipient,
      customer_email: recipient,
      email: recipient,
      customer_name: customerName,
      name: customerName,
    };

    const payload: Record<string, unknown> = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: normalizedTemplateParams,
    };

    if (privateKey) {
      payload.accessToken = privateKey;
    }

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`EmailJS failed (${response.status}): ${responseText}`);
    }

    return new Response(JSON.stringify({ success: true, recipient, providerResponse: responseText }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error sending customer email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
