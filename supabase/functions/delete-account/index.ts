import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create regular client to verify user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Verify the user's JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Starting account deletion for user: ${user.id}`)

    // List of tables to clean up (in order of dependency)
    const tablesToClean = [
      'messages',           // Delete messages first (depends on conversations)
      'conversations',      // Delete conversations next (depends on clients)
      'business_expenses',
      'business_outcomes', 
      'client_metrics',
      'expenses',
      'knowledge_base_entries',
      'clients',           // Delete clients (depends on user)
      'integrations',      // Delete integrations
      'ai_settings',       // Delete AI settings
      'profiles'           // Delete profiles last
    ]

    // Delete user data from all tables
    const deletionResults = []
    for (const table of tablesToClean) {
      try {
        const { error, count } = await supabaseAdmin
          .from(table)
          .delete({ count: 'exact' })
          .eq('user_id', user.id)
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.warn(`Warning deleting from ${table}:`, error)
          deletionResults.push({ table, status: 'warning', error: error.message })
        } else {
          deletionResults.push({ table, status: 'success', deletedRows: count || 0 })
        }
      } catch (error) {
        console.error(`Error deleting from ${table}:`, error)
        deletionResults.push({ table, status: 'error', error: error.message })
      }
    }

    // Delete user files from storage buckets
    const buckets = ['receipts', 'avatars', 'documents']
    for (const bucket of buckets) {
      try {
        // List all files for this user in the bucket
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from(bucket)
          .list(user.id)
        
        if (listError && listError.message !== 'The resource was not found') {
          console.warn(`Warning listing files in ${bucket}:`, listError)
          deletionResults.push({ 
            table: `storage:${bucket}`, 
            status: 'warning', 
            error: listError.message 
          })
          continue
        }

        if (files && files.length > 0) {
          // Delete all files for this user
          const filePaths = files.map(file => `${user.id}/${file.name}`)
          const { error: deleteError } = await supabaseAdmin.storage
            .from(bucket)
            .remove(filePaths)
          
          if (deleteError) {
            console.warn(`Warning deleting files from ${bucket}:`, deleteError)
            deletionResults.push({ 
              table: `storage:${bucket}`, 
              status: 'warning', 
              error: deleteError.message 
            })
          } else {
            deletionResults.push({ 
              table: `storage:${bucket}`, 
              status: 'success', 
              deletedRows: files.length 
            })
          }
        } else {
          deletionResults.push({ 
            table: `storage:${bucket}`, 
            status: 'success', 
            deletedRows: 0 
          })
        }
      } catch (error) {
        console.error(`Error deleting from storage ${bucket}:`, error)
        deletionResults.push({ 
          table: `storage:${bucket}`, 
          status: 'error', 
          error: error.message 
        })
      }
    }

    console.log(`Data cleanup completed for user: ${user.id}`)

    // IMPORTANT: Delete the auth user LAST, after all data cleanup is complete
    // This prevents session invalidation from interfering with cleanup operations
    console.log('Attempting to delete auth user with admin privileges...')
    
    try {
      // Method 1: Try admin.deleteUser first
      const { data: deleteData, error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      
      if (deleteUserError) {
        console.error('Method 1 failed - admin.deleteUser error:', deleteUserError)
        
        // Method 2: Try using RPC call to delete from auth.users directly
        console.log('Trying Method 2: Direct auth.users deletion...')
        const { error: rpcError } = await supabaseAdmin.rpc('delete_auth_user_direct', { 
          target_user_id: user.id 
        })
        
        if (rpcError) {
          console.error('Method 2 failed - RPC error:', rpcError)
          
          // Method 3: Use SQL to delete from auth.users (requires service role)
          console.log('Trying Method 3: Raw SQL deletion...')
          const { error: sqlError } = await supabaseAdmin
            .from('auth.users')
            .delete()
            .eq('id', user.id)
          
          if (sqlError) {
            console.error('Method 3 failed - SQL error:', sqlError)
            throw new Error(`All auth deletion methods failed. Last error: ${sqlError.message}`)
          } else {
            console.log('Method 3 succeeded: Raw SQL deletion worked')
          }
        } else {
          console.log('Method 2 succeeded: RPC deletion worked')
        }
      } else {
        console.log('Method 1 succeeded: admin.deleteUser worked', deleteData)
      }
      
      console.log(`Successfully deleted complete account for user: ${user.id}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Account and all associated data deleted successfully',
          dataCleanup: deletionResults
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
      
    } catch (authDeletionError) {
      console.error('All auth user deletion methods failed:', authDeletionError)
      
      // Data cleanup succeeded but auth deletion failed
      return new Response(
        JSON.stringify({ 
          success: false, // Mark as failure since auth wasn't deleted
          error: 'Failed to delete auth user - user can still log in',
          warning: 'Data cleanup completed but auth user deletion failed', 
          details: authDeletionError.message,
          dataCleanup: deletionResults
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Unexpected error in delete-account function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})