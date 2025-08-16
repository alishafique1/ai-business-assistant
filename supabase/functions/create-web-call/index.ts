import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  // Set CORS headers for actual request
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders,
    });
  }

  const body = await req.json().catch(() => ({}));
  const { agent_id, customer_name, customer_email, metadata } = body;

  const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY')!;
  if (!RETELL_API_KEY) {
    return new Response('Missing RETELL_API_KEY', { 
      status: 500,
      headers: corsHeaders,
    });
  }

  // Create web call (Retell Call API v2)
  const res = await fetch('https://api.retellai.com/v2/create-web-call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RETELL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id,               // required
      type: 'web',            // distinguish web vs phone
      customer_name,          // optional
      customer_email,         // optional
      metadata,               // optional (e.g., page, plan, userId)
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    return new Response(`Retell error: ${t}`, { 
      status: 500,
      headers: corsHeaders,
    });
  }

  const data = await res.json(); // { call_id, access_token, ... }
  return new Response(JSON.stringify(data), { headers: corsHeaders });
});