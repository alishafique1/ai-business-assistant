import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET') {
      // Check current receipt usage
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('receipt_count, receipt_count_reset_date, subscription_plan')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw profileError
      }

      const plan = profile?.subscription_plan || 'free'
      const currentCount = profile?.receipt_count || 0
      const resetDate = profile?.receipt_count_reset_date
      
      // Check if we need to reset (new month)
      const now = new Date()
      const currentMonth = now.getFullYear() * 12 + now.getMonth()
      const resetMonth = resetDate ? 
        new Date(resetDate).getFullYear() * 12 + new Date(resetDate).getMonth() : 
        currentMonth

      let actualCount = currentCount
      if (currentMonth > resetMonth) {
        // Reset count for new month
        await supabaseClient
          .from('profiles')
          .update({ 
            receipt_count: 0, 
            receipt_count_reset_date: now.toISOString().split('T')[0] 
          })
          .eq('id', user.id)
        actualCount = 0
      }

      const limits = {
        free: 5,
        business_pro: 999999,
        enterprise: 999999
      }
      
      const limit = limits[plan as keyof typeof limits] || 5
      const canAdd = actualCount < limit
      
      return new Response(
        JSON.stringify({
          success: true,
          current_count: actualCount,
          monthly_limit: limit === 999999 ? 'unlimited' : limit,
          can_add_receipt: canAdd,
          plan: plan,
          days_until_reset: 30 - now.getDate()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      // Increment receipt count
      const { data, error } = await supabaseClient
        .rpc('check_and_increment_receipt_count', { user_id_param: user.id })

      if (error) {
        throw error
      }

      const result = data[0]
      return new Response(
        JSON.stringify({
          success: true,
          can_add_receipt: result.can_add_receipt,
          current_count: result.current_count,
          limit_reached: result.limit_reached
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    console.error('Receipt limit check error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})