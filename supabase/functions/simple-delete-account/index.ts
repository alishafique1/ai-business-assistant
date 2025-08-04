import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-my-custom-header',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== SIMPLE DELETE ACCOUNT FUNCTION STARTED ===')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))

    // Create a Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      hasAnonKey: !!anonKey
    })

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing required environment variables')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Server configuration error - missing environment variables'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No authorization header' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create regular client to verify user
    const supabase = createClient(supabaseUrl, anonKey || '')

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '')
    console.log('Verifying user token...')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    console.log('User verification result:', {
      hasUser: !!user,
      userId: user?.id,
      userError: userError?.message
    })

    if (userError || !user) {
      console.error('User verification failed:', userError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid or expired token',
          details: userError?.message
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Starting auth user deletion for user: ${user.id}`)

    // Delete the auth user using admin client
    console.log('Attempting to delete auth user with admin privileges...')
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    console.log('Delete user result:', {
      success: !deleteUserError,
      error: deleteUserError?.message
    })
    
    if (deleteUserError) {
      console.error('Failed to delete auth user:', deleteUserError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to delete auth user',
          details: deleteUserError.message,
          debugInfo: {
            userId: user.id,
            hasServiceRole: !!serviceRoleKey
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Successfully deleted auth user: ${user.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Auth user deleted successfully',
        userId: user.id,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in simple-delete-account function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})