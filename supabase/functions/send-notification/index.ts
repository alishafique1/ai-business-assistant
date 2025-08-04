import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  delivery_channel: 'email' | 'push' | 'sms';
  related_expense_id?: string;
  related_data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, notification_type, title, message, delivery_channel, related_expense_id, related_data } = await req.json() as NotificationRequest

    console.log('📧 Processing notification request:', { user_id, notification_type, delivery_channel })

    // Get user's notification preferences
    const { data: preferences, error: prefError } = await supabaseClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (prefError || !preferences) {
      console.error('❌ Failed to get notification preferences:', prefError)
      return new Response(
        JSON.stringify({ success: false, error: 'User preferences not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has enabled this type of notification
    const notificationEnabled = checkNotificationEnabled(preferences, notification_type, delivery_channel)
    
    if (!notificationEnabled) {
      console.log('⏭️ Notification disabled by user preferences')
      return new Response(
        JSON.stringify({ success: true, message: 'Notification disabled by user preferences' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check quiet hours
    if (preferences.quiet_hours_enabled && isInQuietHours(preferences)) {
      console.log('🔇 Currently in quiet hours, scheduling for later')
      // Schedule for after quiet hours
      const scheduledTime = getNextAllowedTime(preferences)
      
      await scheduleNotification(supabaseClient, {
        user_id,
        notification_type,
        title,
        message,
        delivery_channel,
        related_expense_id,
        related_data,
        scheduled_for: scheduledTime
      })
      
      return new Response(
        JSON.stringify({ success: true, message: 'Notification scheduled for after quiet hours' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle different delivery channels
    let deliveryResult = { success: false, error: 'Unknown delivery channel' }
    
    switch (delivery_channel) {
      case 'email':
        deliveryResult = await sendEmailNotification(supabaseClient, user_id, title, message, related_data)
        break
      case 'push':
        deliveryResult = await sendPushNotification(user_id, title, message, related_data)
        break
      case 'sms':
        deliveryResult = await sendSMSNotification(user_id, title, message, related_data)
        break
    }

    // Record notification in history
    await supabaseClient
      .from('notification_history')
      .insert({
        user_id,
        notification_type,
        title,
        message,
        delivery_channel,
        delivery_status: deliveryResult.success ? 'sent' : 'failed',
        delivery_error: deliveryResult.success ? null : deliveryResult.error,
        related_expense_id,
        related_data,
        sent_at: new Date().toISOString()
      })

    console.log('✅ Notification processed:', deliveryResult)

    return new Response(
      JSON.stringify(deliveryResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error processing notification:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function checkNotificationEnabled(preferences: any, notification_type: string, delivery_channel: string): boolean {
  // Check if the delivery channel is enabled
  if (delivery_channel === 'email' && !preferences.email_notifications) return false
  if (delivery_channel === 'push' && !preferences.push_notifications) return false
  if (delivery_channel === 'sms' && !preferences.sms_notifications) return false

  // Check if the specific notification type is enabled
  const typeMapping: { [key: string]: string } = {
    'expense_alert': 'expense_alerts',
    'budget_warning': 'budget_warnings',
    'large_expense': 'large_expense_threshold',
    'duplicate_expense': 'duplicate_expense_warnings',
    'ai_insight': 'ai_insights',
    'smart_categorization': 'smart_categorization_suggestions',
    'receipt_processing': 'receipt_processing_status',
    'login_alert': 'login_alerts',
    'account_change': 'account_changes',
    'data_export': 'data_export_completion',
    'feature_update': 'feature_updates',
    'product_announcement': 'product_announcements',
    'tip_tutorial': 'tips_and_tutorials',
    'daily_summary': 'daily_summaries',
    'weekly_insight': 'weekly_insights',
    'monthly_report': 'monthly_reports'
  }

  const preferenceKey = typeMapping[notification_type]
  return preferenceKey ? preferences[preferenceKey] === true : false
}

function isInQuietHours(preferences: any): boolean {
  if (!preferences.quiet_hours_enabled) return false
  
  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 8) // HH:MM:SS format
  
  const quietStart = preferences.quiet_hours_start || '22:00:00'
  const quietEnd = preferences.quiet_hours_end || '08:00:00'
  
  // Handle quiet hours that span midnight
  if (quietStart > quietEnd) {
    return currentTime >= quietStart || currentTime <= quietEnd
  } else {
    return currentTime >= quietStart && currentTime <= quietEnd
  }
}

function getNextAllowedTime(preferences: any): string {
  const now = new Date()
  const quietEnd = preferences.quiet_hours_end || '08:00:00'
  const [hours, minutes] = quietEnd.split(':').map(Number)
  
  const nextAllowed = new Date(now)
  nextAllowed.setHours(hours, minutes, 0, 0)
  
  // If quiet end time has already passed today, schedule for tomorrow
  if (nextAllowed <= now) {
    nextAllowed.setDate(nextAllowed.getDate() + 1)
  }
  
  return nextAllowed.toISOString()
}

async function scheduleNotification(supabaseClient: any, notification: any) {
  await supabaseClient
    .from('notification_history')
    .insert({
      ...notification,
      delivery_status: 'pending'
    })
}

async function sendEmailNotification(supabaseClient: any, user_id: string, title: string, message: string, related_data: any) {
  try {
    // Get user email
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(user_id)
    
    if (userError || !userData.user?.email) {
      return { success: false, error: 'User email not found' }
    }

    const email = userData.user.email

    console.log('📧 Sending email notification to:', email)

    // For now, we'll simulate email sending
    // In production, you would integrate with SendGrid, AWS SES, or similar
    console.log(`📧 EMAIL TO: ${email}`)
    console.log(`📧 SUBJECT: ${title}`)
    console.log(`📧 MESSAGE: ${message}`)
    
    // Simulate email sending success
    return { success: true, message: 'Email sent successfully' }
    
  } catch (error) {
    console.error('❌ Email send error:', error)
    return { success: false, error: error.message }
  }
}

async function sendPushNotification(user_id: string, title: string, message: string, related_data: any) {
  try {
    console.log('📱 Sending push notification to user:', user_id)
    console.log(`📱 TITLE: ${title}`)
    console.log(`📱 MESSAGE: ${message}`)
    
    // In production, you would integrate with FCM, OneSignal, or similar
    // For now, simulate push notification
    return { success: true, message: 'Push notification sent successfully' }
    
  } catch (error) {
    console.error('❌ Push notification error:', error)
    return { success: false, error: error.message }
  }
}

async function sendSMSNotification(user_id: string, title: string, message: string, related_data: any) {
  try {
    console.log('📱 Sending SMS notification to user:', user_id)
    console.log(`📱 MESSAGE: ${title} - ${message}`)
    
    // In production, you would integrate with Twilio, AWS SNS, or similar
    // For now, simulate SMS sending
    return { success: true, message: 'SMS sent successfully' }
    
  } catch (error) {
    console.error('❌ SMS send error:', error)
    return { success: false, error: error.message }
  }
}