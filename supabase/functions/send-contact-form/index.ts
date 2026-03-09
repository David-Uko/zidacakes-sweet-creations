const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message } = await req.json();
    const accessKey = Deno.env.get("WEB3FORMS_ACCESS_KEY");

    if (!accessKey) {
      throw new Error("WEB3FORMS_ACCESS_KEY not configured");
    }

    if (!name || !email || !message) {
      throw new Error("Name, email, and message are required");
    }

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: subject ? `Contact Form: ${subject}` : "New Contact Form Message",
        from_name: "Zidacakes'n'more Contact",
        name,
        email,
        message: `
Contact Form Submission

Name: ${name}
Email: ${email}
Subject: ${subject || "No subject"}

Message:
${message}
        `.trim(),
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error sending contact form:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
