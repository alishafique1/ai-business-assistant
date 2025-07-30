import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Environment variables - you'll add these in Supabase Dashboard
const WHATSAPP_VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'your-verify-token-here'
const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || 'your-access-token-here'
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || 'your-phone-number-id-here'

interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: string;
}

interface WhatsAppWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: WhatsAppMessage[];
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method === 'GET') {
      // Webhook verification for Meta
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      console.log('Webhook verification attempt:', { mode, token, challenge })

      if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
        console.log('Webhook verified successfully')
        return new Response(challenge, { 
          status: 200,
          headers: corsHeaders 
        })
      } else {
        console.log('Webhook verification failed - invalid token')
        return new Response('Forbidden', { 
          status: 403,
          headers: corsHeaders 
        })
      }
    }

    if (req.method === 'POST') {
      // Handle incoming WhatsApp messages
      const body: WhatsAppWebhookBody = await req.json()
      
      console.log('Received WhatsApp webhook:', JSON.stringify(body, null, 2))

      // Verify it's a WhatsApp webhook
      if (body.object !== 'whatsapp_business_account') {
        console.log('Invalid webhook object type:', body.object)
        return new Response('Bad Request', { 
          status: 400,
          headers: corsHeaders 
        })
      }

      // Process each entry
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value.messages) {
            // Process incoming messages
            for (const message of change.value.messages) {
              console.log('Processing message:', message)
              await processIncomingMessage(message)
            }
          }
          
          if (change.field === 'messages' && change.value.statuses) {
            // Process message status updates
            for (const status of change.value.statuses) {
              console.log('Message status update:', status)
              await processMessageStatus(status)
            }
          }
        }
      }

      return new Response('OK', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal Server Error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})

async function processIncomingMessage(message: WhatsAppMessage) {
  try {
    console.log(`Processing message from ${message.from}: ${message.text?.body}`)
    
    if (message.type === 'text' && message.text?.body) {
      const messageText = message.text.body.toLowerCase().trim()
      const senderNumber = message.from

      // Check if this is an expense-related message
      if (isExpenseMessage(messageText)) {
        console.log('Detected expense message, processing...')
        await handleExpenseMessage(messageText, senderNumber, message.id)
      } else if (isGeneralQuery(messageText)) {
        console.log('Detected general query, processing...')
        await handleGeneralQuery(messageText, senderNumber)
      } else {
        // Default response for unrecognized messages
        await sendWhatsAppMessage(senderNumber, 
          "Hi! I'm your AI business assistant. I can help you:\n\n" +
          "💰 Track expenses - just tell me about your spending\n" +
          "📊 Answer business questions\n" +
          "🧾 Process receipt images\n\n" +
          "Try saying something like: 'I spent $25 on lunch at Joe's Cafe'"
        )
      }
    }
  } catch (error) {
    console.error('Error processing message:', error)
    // Send error message back to user
    await sendWhatsAppMessage(message.from, 
      "Sorry, I encountered an error processing your message. Please try again."
    )
  }
}

async function processMessageStatus(status: any) {
  console.log('Message status update:', status)
  // Handle message delivery status updates (sent, delivered, read, failed)
  // You can store these in your database for tracking
}

function isExpenseMessage(text: string): boolean {
  const expenseKeywords = [
    'spent', 'paid', 'bought', 'purchase', 'cost', 'expense', '$', 'dollar',
    'lunch', 'dinner', 'coffee', 'gas', 'fuel', 'taxi', 'uber', 'hotel',
    'flight', 'ticket', 'receipt', 'bill', 'invoice'
  ]
  
  return expenseKeywords.some(keyword => text.includes(keyword))
}

function isGeneralQuery(text: string): boolean {
  const queryKeywords = [
    'how', 'what', 'when', 'where', 'why', 'help', 'question', 'tell me',
    'explain', 'show me', 'report', 'summary', 'total', 'balance'
  ]
  
  return queryKeywords.some(keyword => text.includes(keyword))
}

async function handleExpenseMessage(text: string, senderNumber: string, messageId: string) {
  try {
    // Extract expense information using AI/regex
    const expenseData = await extractExpenseFromText(text)
    
    if (expenseData.amount && expenseData.description) {
      // Call the create-expense function to save the expense
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-expense`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: expenseData.amount,
          title: expenseData.description,
          description: `WhatsApp expense from ${senderNumber}`,
          category: expenseData.category || 'other',
          source: 'whatsapp',
          whatsapp_message_id: messageId
        })
      })

      if (response.ok) {
        await sendWhatsAppMessage(senderNumber, 
          `✅ Expense recorded successfully!\n\n` +
          `💰 Amount: $${expenseData.amount}\n` +
          `📝 Description: ${expenseData.description}\n` +
          `📂 Category: ${expenseData.category || 'Other'}\n\n` +
          `Your expense has been added to your dashboard.`
        )
      } else {
        throw new Error('Failed to save expense')
      }
    } else {
      // Ask for more details
      await sendWhatsAppMessage(senderNumber,
        "I need more details to record this expense. Please include:\n\n" +
        "💰 Amount (e.g., $25.50)\n" +
        "📝 What it was for\n\n" +
        "Example: 'I spent $25 on lunch at Joe's Cafe'"
      )
    }
  } catch (error) {
    console.error('Error handling expense message:', error)
    await sendWhatsAppMessage(senderNumber,
      "Sorry, I couldn't process that expense. Please try again with the format:\n" +
      "'I spent $[amount] on [description]'"
    )
  }
}

async function handleGeneralQuery(text: string, senderNumber: string) {
  try {
    // For now, provide a helpful response
    // Later you can integrate with your AI chat function
    await sendWhatsAppMessage(senderNumber,
      "I'm here to help with your business questions! 🤖\n\n" +
      "I can assist with:\n" +
      "📊 Expense tracking and reports\n" +
      "💼 Business insights\n" +
      "📈 Financial summaries\n\n" +
      "What would you like to know?"
    )
  } catch (error) {
    console.error('Error handling general query:', error)
  }
}

async function extractExpenseFromText(text: string): Promise<{
  amount?: number;
  description?: string;
  category?: string;
}> {
  // Simple regex-based extraction (you can enhance this with AI later)
  const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;
  
  // Extract description (everything after common expense words)
  const descriptionPatterns = [
    /(?:spent|paid|bought|purchase).*?(?:on|for)\s+(.+?)(?:\s+(?:at|from)\s+(.+?))?$/i,
    /(.+?)\s+(?:cost|was)\s+\$?\d+/i,
    /\$?\d+\s+(?:for|on)\s+(.+?)$/i
  ];
  
  let description = '';
  for (const pattern of descriptionPatterns) {
    const match = text.match(pattern);
    if (match) {
      description = match[1].trim();
      break;
    }
  }
  
  // Simple category detection
  let category = 'other';
  const categoryMap = {
    'food': ['lunch', 'dinner', 'breakfast', 'coffee', 'restaurant', 'meal'],
    'travel': ['taxi', 'uber', 'flight', 'hotel', 'gas', 'fuel'],
    'office': ['supplies', 'equipment', 'software'],
    'marketing': ['advertising', 'promotion', 'marketing']
  };
  
  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
      category = cat;
      break;
    }
  }
  
  return { amount, description, category };
}

async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        text: { body: message }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to send WhatsApp message:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('WhatsApp message sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}