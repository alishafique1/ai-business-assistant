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
    const { message, conversationId, userId } = await req.json();
    
    console.log('Processing chat message:', { conversationId, userId });

    if (!customModelUrl || customModelUrl === 'YOUR_CUSTOM_MODEL_ENDPOINT_HERE') {
      throw new Error('Custom model URL not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get conversation history if conversationId exists
    let conversationMessages = [
      {
        role: 'system',
        content: 'You are a helpful AI business assistant. You help users with document management, business questions, and general assistance. Be concise and professional.'
      }
    ];

    if (conversationId) {
      const { data: history } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20); // Last 20 messages for context

      if (history) {
        conversationMessages.push(...history);
      }
    }

    // Add the current user message
    conversationMessages.push({ role: 'user', content: message });

    // Save user message to database
    if (conversationId) {
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message
        });
    }

    // Get AI response from custom model
    const response = await fetch(customModelUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any authentication headers your custom model requires
        // 'Authorization': 'Bearer YOUR_CUSTOM_API_KEY',
      },
      body: JSON.stringify({
        // Adapt this payload to match your custom model's API format
        messages: conversationMessages,
        // Add any custom parameters your model needs
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Custom model API error: ${response.status} ${response.statusText}`);
    }

    const aiResponse = await response.json();
    
    // Adapt this to match your custom model's response format
    // You may need to change this line based on how your model returns responses
    const assistantMessage = aiResponse.message || aiResponse.response || aiResponse.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';

    // Save assistant message to database
    if (conversationId) {
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantMessage
        });
    }

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-chat:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});