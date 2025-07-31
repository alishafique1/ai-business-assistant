import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Use anon key and set JWT for proper RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Verify the user with the provided JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error(`Invalid user: ${userError?.message || 'Unknown error'}`);
    }

    const { expenseId, title, amount, category, description, date } = await req.json();

    // Validate required fields
    if (!expenseId || !title || !amount) {
      throw new Error('Expense ID, title and amount are required');
    }

    // Map category to enum values
    const categoryMapping: { [key: string]: string } = {
      'office supplies': 'office_supplies',
      'office_supplies': 'office_supplies',
      'travel': 'travel',
      'meals': 'meals',
      'food': 'meals',
      'food & dining': 'meals',
      'software': 'software',
      'technology': 'software',
      'marketing': 'marketing',
      'equipment': 'equipment',
      'professional services': 'professional_services',
      'professional_services': 'professional_services',
      'utilities': 'utilities',
      'health & wellness': 'other',
      'healthcare': 'other',
      'entertainment': 'other',
      'education': 'other',
      'other': 'other'
    };

    const mappedCategory = categoryMapping[category?.toLowerCase()] || 'other';
    console.log('Category mapping:', { original: category, mapped: mappedCategory });

    const { data: expense, error } = await supabase
      .from('expenses')
      .update({
        title: title, // Store title in title field
        description: description, // Store description in description field
        amount: parseFloat(amount),
        category: mappedCategory,
        date: date || new Date().toISOString().split('T')[0] // Store date in date field as YYYY-MM-DD
      })
      .eq('id', expenseId)
      .eq('user_id', user.id) // Ensure user can only update their own expenses
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ expense }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating expense:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});