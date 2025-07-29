import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, imageBase64, fileName } = await req.json()

    if (!userId || !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
    
    // Convert base64 to blob for processing
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    // Here you would integrate with your custom ML model
    // For now, I'll create a mock response that simulates ML extraction
    // Replace this with your actual ML model API call
    
    const mockMLResponse = await processReceiptWithML(imageBuffer, fileName)

    // Store the receipt image in Supabase storage (optional)
    let receiptUrl = null
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(`${userId}/${Date.now()}-${fileName}`, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(uploadData.path)
        receiptUrl = urlData.publicUrl
      }
    } catch (storageError) {
      console.error('Storage error:', storageError)
      // Continue processing even if storage fails
    }

    // Return the processed expense data
    return new Response(
      JSON.stringify({
        success: true,
        expenses: mockMLResponse.expenses,
        receiptUrl: receiptUrl,
        confidence: mockMLResponse.confidence,
        rawExtraction: mockMLResponse.rawData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing receipt:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process receipt',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Mock ML processing function - Replace this with your actual ML model integration
async function processReceiptWithML(imageBuffer: Uint8Array, fileName: string) {
  // Simulate ML processing delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Mock OCR/ML extraction results
  // In reality, this would call your custom ML model API
  // The model should return structured data like this:
  
  const mockExtractedData = {
    expenses: [
      {
        amount: parseFloat((Math.random() * 100 + 10).toFixed(2)),
        title: generateMockTitle(fileName),
        description: generateMockDescription(),
        category: generateMockCategory(),
        date: new Date().toISOString().split('T')[0],
        vendor: generateMockVendor(),
        tax: parseFloat((Math.random() * 10).toFixed(2)),
        subtotal: null,
        currency: 'USD'
      }
    ],
    confidence: Math.random() > 0.3 ? 'high' : 'medium',
    rawData: {
      extractedText: 'Sample OCR text from receipt...',
      detectedFields: ['amount', 'date', 'vendor'],
      processingTime: '2.1s'
    }
  }

  return mockExtractedData
}

function generateMockTitle(fileName: string): string {
  const titles = [
    'Restaurant Meal',
    'Office Supplies',
    'Taxi Ride',
    'Coffee & Snacks',
    'Business Lunch',
    'Hotel Stay',
    'Equipment Purchase',
    'Software Subscription'
  ]
  return titles[Math.floor(Math.random() * titles.length)]
}

function generateMockDescription(): string {
  const descriptions = [
    'Business meeting expense',
    'Client entertainment',
    'Office equipment',
    'Travel expense',
    'Marketing materials',
    'Professional services'
  ]
  return descriptions[Math.floor(Math.random() * descriptions.length)]
}

function generateMockCategory(): string {
  const categories = ['meals', 'travel', 'office', 'marketing', 'software', 'other']
  return categories[Math.floor(Math.random() * categories.length)]
}

function generateMockVendor(): string {
  const vendors = [
    'Starbucks',
    'Uber',
    'Amazon',
    'Office Depot',
    'Marriott Hotel',
    'Local Restaurant',
    'Tech Store'
  ]
  return vendors[Math.floor(Math.random() * vendors.length)]
}

/* 
INSTRUCTIONS FOR INTEGRATING YOUR CUSTOM ML MODEL:

Replace the `processReceiptWithML` function with a call to your actual ML model.
Your ML model should:

1. Accept image data (base64 or binary)
2. Perform OCR and entity extraction
3. Return structured data in this format:

{
  expenses: [
    {
      amount: number,           // extracted monetary amount
      title: string,           // descriptive title
      description?: string,    // additional details
      category: string,        // expense category
      date: string,           // date in YYYY-MM-DD format
      vendor?: string,        // merchant/vendor name
      tax?: number,           // tax amount if detected
      subtotal?: number,      // subtotal if available
      currency?: string       // currency code
    }
  ],
  confidence: 'high' | 'medium' | 'low',
  rawData?: any              // raw OCR/extraction data for debugging
}

Example integration:
```typescript
async function processReceiptWithML(imageBuffer: Uint8Array, fileName: string) {
  const response = await fetch('YOUR_ML_MODEL_ENDPOINT', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('ML_API_KEY')}`
    },
    body: JSON.stringify({
      image: btoa(String.fromCharCode(...imageBuffer)),
      filename: fileName
    })
  })
  
  return await response.json()
}
```
*/