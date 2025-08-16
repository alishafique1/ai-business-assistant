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
    const { 
      price_id, 
      user_id, 
      user_email, 
      plan_name,
      success_url, 
      cancel_url, 
      metadata = {} 
    } = body;

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    // Create or retrieve customer
    const customerSearchResponse = await stripe.customers.search({
      query: `email:'${user_email}'`,
    });

    let customer;
    if (customerSearchResponse.data.length > 0) {
      customer = customerSearchResponse.data[0];
    } else {
      customer = await stripe.customers.create({
        email: user_email,
        metadata: {
          user_id,
        },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url,
      cancel_url,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      automatic_tax: { enabled: true },
      metadata: {
        user_id,
        plan_name,
        ...metadata,
      },
      subscription_data: {
        metadata: {
          user_id,
          plan_name,
          ...metadata,
        },
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error creating checkout session:', error);
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