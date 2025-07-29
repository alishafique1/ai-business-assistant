import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const customModelUrl = Deno.env.get('CUSTOM_MODEL_URL') || 'YOUR_CUSTOM_MODEL_ENDPOINT_HERE';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, fileType, fileSize } = await req.json();
    
    console.log('Categorizing document:', { fileName, fileType, fileSize });

    if (!customModelUrl || customModelUrl === 'YOUR_CUSTOM_MODEL_ENDPOINT_HERE') {
      throw new Error('Custom model URL not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use custom AI model to categorize the document based on filename and type
    const response = await fetch(customModelUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any authentication headers your custom model requires
        // 'Authorization': 'Bearer YOUR_CUSTOM_API_KEY',
      },
      body: JSON.stringify({
        // Adapt this payload to match your custom model's API format
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

    if (!response.ok) {
      throw new Error(`Custom model API error: ${response.status} ${response.statusText}`);
    }

    const aiResponse = await response.json();
    
    // Adapt this to match your custom model's response format
    const category = (aiResponse.message || aiResponse.response || aiResponse.choices?.[0]?.message?.content || 'other').trim().toLowerCase();

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