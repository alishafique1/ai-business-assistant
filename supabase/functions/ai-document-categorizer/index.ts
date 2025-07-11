import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, fileType, fileSize } = await req.json();
    
    console.log('Categorizing document:', { fileName, fileType, fileSize });

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use AI to categorize the document based on filename and type
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a document categorization assistant. Based on the filename, file type, and size, categorize documents into one of these categories: 
            - contracts
            - invoices
            - receipts
            - reports
            - presentations
            - images
            - legal
            - financial
            - marketing
            - other
            
            Respond with only the category name in lowercase.`
          },
          {
            role: 'user',
            content: `Categorize this document:
            Filename: ${fileName}
            Type: ${fileType}
            Size: ${fileSize} bytes`
          }
        ],
        temperature: 0.3,
        max_tokens: 50,
      }),
    });

    const aiResponse = await response.json();
    const category = aiResponse.choices[0].message.content.trim().toLowerCase();

    console.log('AI categorization result:', category);

    return new Response(
      JSON.stringify({ 
        category,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-document-categorizer:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        category: 'other' // fallback category
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});