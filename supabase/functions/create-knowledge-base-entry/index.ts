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
    const { userId, title, content, category, tags } = await req.json();
    
    console.log('Creating knowledge base entry:', { userId, title, category });

    if (!userId || !title || !content) {
      throw new Error('Missing required fields: userId, title, or content');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert the knowledge base entry
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        user_id: userId,
        business_name: title, // Using title as business_name for now
        industry: category || 'general',
        target_audience: content.substring(0, 255), // Store first part of content as target_audience
        products_services: tags ? tags.join(', ') : null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('Knowledge base entry created successfully');

    return new Response(
      JSON.stringify({ 
        entry: data,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating knowledge base entry:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});