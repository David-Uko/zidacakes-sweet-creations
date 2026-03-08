const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData = await req.json();
    const accessKey = Deno.env.get('WEB3FORMS_ACCESS_KEY');

    if (!accessKey) {
      throw new Error('WEB3FORMS_ACCESS_KEY not configured');
    }

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `New Custom Cake Order - ${orderData.orderId}`,
        from_name: "Zidacakes'n'more Orders",
        name: orderData.fullName,
        email: orderData.email,
        message: `
New Custom Cake Order

Order ID: ${orderData.orderId}
Submitted: ${orderData.timestamp || new Date().toISOString()}

Customer Details:
- Name: ${orderData.fullName}
- Email: ${orderData.email}
- Phone: ${orderData.phoneNumber || 'Not provided'}

Cake Details:
- Size: ${orderData.size}
- Flavor: ${orderData.flavor}
- Filling: ${orderData.filling}
- Color: ${orderData.color}
- Delivery Method: ${orderData.deliveryMethod}
- Delivery Date: ${orderData.deliveryDate || 'Not specified'}
- Special Instructions: ${orderData.notes || 'None'}

Reference Image: ${orderData.referenceImageUrl || 'No image uploaded'}

Status: Order Placed — Awaiting Review
        `.trim(),
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
