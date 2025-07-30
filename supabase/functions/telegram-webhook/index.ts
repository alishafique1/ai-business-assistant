import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Environment variables - you'll add these in Supabase Dashboard
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || 'your-bot-token-here'
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') || 'your-webhook-secret-here'

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  date: number;
  chat: {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  text?: string;
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
  }>;
  voice?: {
    file_id: string;
    file_unique_id: string;
    duration: number;
    mime_type?: string;
    file_size?: number;
  };
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data?: string;
  };
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
    if (req.method === 'POST') {
      const update: TelegramUpdate = await req.json()
      
      console.log('Received Telegram update:', JSON.stringify(update, null, 2))

      // Process the update
      if (update.message) {
        await handleMessage(update.message)
      } else if (update.callback_query) {
        await handleCallbackQuery(update.callback_query)
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
    console.error('Telegram webhook error:', error)
    return new Response('Internal Server Error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})

async function handleMessage(message: TelegramMessage) {
  try {
    const chatId = message.chat.id
    const userId = message.from?.id
    const userName = message.from?.first_name || 'User'
    
    console.log(`Processing message from ${userName} (${userId}): ${message.text}`)

    // Handle different message types
    if (message.text) {
      await handleTextMessage(message.text, chatId, userId, userName)
    } else if (message.photo) {
      await handlePhotoMessage(message.photo, chatId, userId)
    } else if (message.voice) {
      await handleVoiceMessage(message.voice, chatId, userId)
    }
  } catch (error) {
    console.error('Error handling message:', error)
    await sendTelegramMessage(message.chat.id, 
      "Sorry, I encountered an error processing your message. Please try again."
    )
  }
}

async function handleTextMessage(text: string, chatId: number, userId?: number, userName?: string) {
  const lowercaseText = text.toLowerCase().trim()

  // Handle bot commands
  if (text.startsWith('/')) {
    await handleBotCommand(text, chatId, userId, userName)
    return
  }

  // Check if this is an expense-related message
  if (isExpenseMessage(lowercaseText)) {
    console.log('Detected expense message, processing...')
    await handleExpenseMessage(text, chatId, userId)
  } else if (isGeneralQuery(lowercaseText)) {
    console.log('Detected general query, processing...')
    await handleGeneralQuery(text, chatId, userId)
  } else {
    // Default response for unrecognized messages
    await sendTelegramMessage(chatId, 
      `Hi ${userName}! 👋 I'm your AI business assistant.\n\n` +
      "I can help you with:\n" +
      "💰 Track expenses - just describe your spending\n" +
      "📊 Get business insights\n" +
      "🏷️ Organize expense categories\n" +
      "📸 Process receipt photos\n\n" +
      "Try saying: 'I spent $25 on lunch at Joe's Cafe'\n" +
      "Or use /help to see all commands"
    )
  }
}

async function handleBotCommand(command: string, chatId: number, userId?: number, userName?: string) {
  const cmd = command.split(' ')[0].toLowerCase()
  
  switch (cmd) {
    case '/start':
      await sendTelegramMessage(chatId,
        `Welcome ${userName}! 🎉\n\n` +
        "I'm your AI business assistant, ready to help you track expenses and manage your business.\n\n" +
        "Here's what I can do:\n" +
        "💰 Track expenses automatically\n" +
        "📊 Provide business insights\n" +
        "🏷️ Categorize your spending\n" +
        "📸 Process receipt images\n\n" +
        "Type /help to see all available commands!"
      )
      break

    case '/help':
      await sendTelegramMessage(chatId,
        "🤖 Available Commands:\n\n" +
        "/expense - Record a new expense\n" +
        "/summary - Get your expense summary\n" +
        "/categories - View expense categories\n" +
        "/recent - Show recent expenses\n" +
        "/help - Show this help message\n\n" +
        "💡 You can also just tell me about expenses naturally:\n" +
        "• 'I spent $25 on lunch'\n" +
        "• 'Paid $50 for office supplies'\n" +
        "• Send me receipt photos!"
      )
      break

    case '/expense':
      await sendTelegramMessage(chatId,
        "💰 Let's record an expense!\n\n" +
        "Tell me:\n" +
        "• How much did you spend?\n" +
        "• What was it for?\n" +
        "• Where did you spend it? (optional)\n\n" +
        "Example: 'I spent $25 on lunch at Joe's Cafe'"
      )
      break

    case '/summary':
      await handleSummaryCommand(chatId, userId)
      break

    case '/categories':
      await handleCategoriesCommand(chatId, userId)
      break

    case '/recent':
      await handleRecentExpensesCommand(chatId, userId)
      break

    default:
      await sendTelegramMessage(chatId,
        "Unknown command. Type /help to see available commands."
      )
  }
}

async function handlePhotoMessage(photos: any[], chatId: number, userId?: number) {
  try {
    // Get the highest quality photo
    const photo = photos[photos.length - 1]
    
    await sendTelegramMessage(chatId, 
      "📸 I received your receipt image! Processing...\n\n" +
      "⏳ Extracting expense information using AI..."
    )

    // Get file info from Telegram
    const fileInfo = await getTelegramFile(photo.file_id)
    
    if (fileInfo.file_path) {
      // Download the image
      const imageUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`
      
      // Process the receipt using your existing receipt processing function
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          source: 'telegram',
          userId: userId
        })
      })

      if (response.ok) {
        const result = await response.json()
        await sendTelegramMessage(chatId,
          `✅ Receipt processed successfully!\n\n` +
          `💰 Amount: $${result.amount}\n` +
          `📝 Description: ${result.description}\n` +
          `🏷️ Category: ${result.category}\n\n` +
          `Your expense has been added to your dashboard! 📊`
        )
      } else {
        throw new Error('Failed to process receipt')
      }
    }
  } catch (error) {
    console.error('Error processing photo:', error)
    await sendTelegramMessage(chatId,
      "❌ Sorry, I couldn't process that receipt image. Please try:\n" +
      "• Taking a clearer photo\n" +
      "• Ensuring good lighting\n" +
      "• Making sure the text is readable"
    )
  }
}

async function handleVoiceMessage(voice: any, chatId: number, userId?: number) {
  await sendTelegramMessage(chatId,
    "🎤 I received your voice message!\n\n" +
    "Voice processing is coming soon. For now, please:\n" +
    "• Type your expense details\n" +
    "• Send receipt photos\n" +
    "• Use /expense command"
  )
}

async function handleExpenseMessage(text: string, chatId: number, userId?: number) {
  try {
    const expenseData = await extractExpenseFromText(text)
    
    if (expenseData.amount && expenseData.description) {
      // Create expense using your existing function
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-expense`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: expenseData.amount,
          title: expenseData.description,
          description: `Telegram expense from user ${userId}`,
          category: expenseData.category || 'other',
          source: 'telegram',
          telegram_user_id: userId
        })
      })

      if (response.ok) {
        await sendTelegramMessage(chatId,
          `✅ Expense recorded!\n\n` +
          `💰 Amount: $${expenseData.amount}\n` +
          `📝 Description: ${expenseData.description}\n` +
          `🏷️ Category: ${expenseData.category || 'Other'}\n\n` +
          `Added to your dashboard! 📊`
        )
      } else {
        throw new Error('Failed to save expense')
      }
    } else {
      await sendTelegramMessage(chatId,
        "I need more details! Please include:\n\n" +
        "💰 Amount (e.g., $25.50)\n" +
        "📝 What it was for\n\n" +
        "Example: 'I spent $25 on lunch at Joe's Cafe'"
      )
    }
  } catch (error) {
    console.error('Error handling expense:', error)
    await sendTelegramMessage(chatId,
      "❌ Couldn't process that expense. Try:\n" +
      "'I spent $[amount] on [description]'"
    )
  }
}

async function handleGeneralQuery(text: string, chatId: number, userId?: number) {
  await sendTelegramMessage(chatId,
    "🤖 I'm here to help with your business questions!\n\n" +
    "I can assist with:\n" +
    "📊 Expense tracking and reports\n" +
    "💼 Business insights\n" +
    "📈 Financial summaries\n\n" +
    "Try /summary for your expense overview!"
  )
}

async function handleSummaryCommand(chatId: number, userId?: number) {
  // This would fetch actual data from your database
  await sendTelegramMessage(chatId,
    "📊 Your Expense Summary\n\n" +
    "💰 This Month: $1,234.56\n" +
    "📅 Total Expenses: 45\n" +
    "🏆 Top Category: Meals & Entertainment\n\n" +
    "Visit your dashboard for detailed reports! 📈"
  )
}

async function handleCategoriesCommand(chatId: number, userId?: number) {
  await sendTelegramMessage(chatId,
    "🏷️ Expense Categories:\n\n" +
    "🍽️ Meals & Entertainment\n" +
    "✈️ Travel\n" +
    "📎 Office Supplies\n" +
    "📱 Software\n" +
    "📢 Marketing\n" +
    "🔧 Equipment\n" +
    "📋 Other\n\n" +
    "I'll automatically categorize your expenses!"
  )
}

async function handleRecentExpensesCommand(chatId: number, userId?: number) {
  await sendTelegramMessage(chatId,
    "📝 Recent Expenses:\n\n" +
    "• $25.00 - Lunch at Joe's Cafe (Today)\n" +
    "• $150.00 - Office supplies (Yesterday)\n" +
    "• $45.00 - Uber ride (2 days ago)\n\n" +
    "View all expenses in your dashboard! 📊"
  )
}

async function handleCallbackQuery(callbackQuery: any) {
  // Handle inline keyboard button presses
  console.log('Callback query:', callbackQuery)
  // You can implement interactive buttons here
}

// Helper functions (same as WhatsApp)
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

async function extractExpenseFromText(text: string): Promise<{
  amount?: number;
  description?: string;
  category?: string;
}> {
  // Same extraction logic as WhatsApp
  const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;
  
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
  
  let category = 'other';
  const categoryMap = {
    'meals': ['lunch', 'dinner', 'breakfast', 'coffee', 'restaurant', 'meal'],
    'travel': ['taxi', 'uber', 'flight', 'hotel', 'gas', 'fuel'],
    'officesupplies': ['supplies', 'equipment', 'software', 'office'],
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

async function sendTelegramMessage(chatId: number, text: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to send Telegram message:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('Telegram message sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

async function getTelegramFile(fileId: string) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
  const result = await response.json();
  return result.result;
}