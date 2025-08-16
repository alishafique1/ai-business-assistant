import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Webhook signature verification failed', { 
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planName = session.metadata?.plan_name;

        if (!userId) {
          throw new Error('Missing user_id in session metadata');
        }

        // Update user subscription status
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan_name: planName || 'Business Pro',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          throw updateError;
        }

        console.log('Subscription created for user:', userId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.log('No user_id in subscription metadata');
          break;
        }

        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          throw updateError;
        }

        console.log('Subscription updated for user:', userId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.log('No user_id in subscription metadata');
          break;
        }

        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          throw updateError;
        }

        console.log('Subscription cancelled for user:', userId);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          // Get subscription to find user_id
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata?.user_id;

          if (userId) {
            const { error: updateError } = await supabase
              .from('user_subscriptions')
              .update({
                status: 'active',
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_subscription_id', subscription.id);

            if (updateError) {
              console.error('Error updating subscription after payment:', updateError);
              throw updateError;
            }

            console.log('Payment succeeded for user:', userId);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          // Get subscription to find user_id
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata?.user_id;

          if (userId) {
            const { error: updateError } = await supabase
              .from('user_subscriptions')
              .update({
                status: 'past_due',
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_subscription_id', subscription.id);

            if (updateError) {
              console.error('Error updating subscription after failed payment:', updateError);
              throw updateError;
            }

            console.log('Payment failed for user:', userId);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Webhook error:', error);
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