import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { user_id, return_url } = body;

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    // Find customer by user_id metadata
    const customers = await stripe.customers.search({
      query: `metadata['user_id']:'${user_id}'`,
    });

    if (customers.data.length === 0) {
      throw new Error('Customer not found');
    }

    const customer = customers.data[0];

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url,
    });

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error creating portal session:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});