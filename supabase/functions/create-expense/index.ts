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
    console.log('Create expense function called');
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
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
      console.error('User authentication failed:', userError);
      throw new Error(`Invalid user: ${userError?.message || 'Unknown error'}`);
    }

    console.log('User authenticated:', user.id);

    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { title, amount, category, description, receipt_url, date } = requestBody;

    // Validate required fields
    if (!title || !amount) {
      console.error('Missing required fields:', { title, amount });
      throw new Error('Title and amount are required');
    }

    console.log('Validated fields:', { title, amount, category, description, date });

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

    const insertData = {
      user_id: user.id,
      title: title,
      description: description || null,
      amount: parseFloat(amount),
      category: mappedCategory,
      date: date || new Date().toISOString().split('T')[0]
    };

    console.log('Inserting expense data:', insertData);

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Expense created successfully:', expense);

    return new Response(
      JSON.stringify({ expense }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating expense:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});