import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

Deno.serve(async (req) => {
  // Get allowed origins from environment or default to common development origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:8081',
    'https://ai-business-assistant.vercel.app',
    'https://www.expenzify.com',
    'https://expenzify.com',
    // Add your custom domain here
    ...(Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [])
  ];

  const origin = req.headers.get('origin');
  const isAllowedOrigin = allowedOrigins.includes(origin || '') || origin?.includes('.vercel.app');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  // Set CORS headers for actual request
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
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

  // Get API key from environment variables
  const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
  
  console.log('RETELL_API_KEY present:', !!RETELL_API_KEY);
  
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