import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      })
    }

    const { email } = await req.json()

    // Validate email
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get user agent and IP for analytics
    const userAgent = req.headers.get('user-agent') || 'Unknown'
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'Unknown'

    // Insert subscription
    const { data, error } = await supabaseClient
      .from('newsletter_subscriptions')
      .insert({
        email: email.toLowerCase().trim(),
        source: 'website_footer',
        user_agent: userAgent,
        ip_address: ipAddress,
      })
      .select()

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ 
            error: 'This email is already subscribed to our newsletter',
            code: 'ALREADY_SUBSCRIBED'
          }),
          { 
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to subscribe. Please try again.' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully subscribed to newsletter!',
        data: data[0]
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})