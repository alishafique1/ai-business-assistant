-- This file contains SQL to create missing RPC functions that are causing 404 errors
-- Run this manually in the Supabase SQL editor

-- Create user_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,
    receipt_uploads INTEGER DEFAULT 0,
    ai_content_suggestions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

-- Create notification_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- General notifications
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  sms_notifications BOOLEAN DEFAULT false,
  
  -- Reports & summaries
  daily_summaries BOOLEAN DEFAULT true,
  weekly_insights BOOLEAN DEFAULT true,
  monthly_reports BOOLEAN DEFAULT false,
  
  -- Business alerts
  expense_alerts BOOLEAN DEFAULT true,
  budget_warnings BOOLEAN DEFAULT true,
  large_expense_threshold BOOLEAN DEFAULT true,
  duplicate_expense_warnings BOOLEAN DEFAULT true,
  
  -- AI & automation
  ai_insights BOOLEAN DEFAULT true,
  smart_categorization_suggestions BOOLEAN DEFAULT true,
  receipt_processing_status BOOLEAN DEFAULT true,
  
  -- Security & account
  login_alerts BOOLEAN DEFAULT true,
  account_changes BOOLEAN DEFAULT true,
  data_export_completion BOOLEAN DEFAULT true,
  
  -- Marketing & updates
  feature_updates BOOLEAN DEFAULT true,
  product_announcements BOOLEAN DEFAULT false,
  tips_and_tutorials BOOLEAN DEFAULT true,
  
  -- Integration notifications
  telegram_notifications BOOLEAN DEFAULT false,
  whatsapp_notifications BOOLEAN DEFAULT false,
  
  -- Timing preferences
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  notification_schedule TEXT DEFAULT 'immediate' CHECK (notification_schedule IN ('immediate', 'batched', 'daily_digest')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all subscriptions" ON user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for user_usage
CREATE POLICY "Users can view own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON user_usage
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all usage" ON user_usage
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notification preferences" ON notification_preferences 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification preferences" ON notification_preferences 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notification preferences" ON notification_preferences 
    FOR DELETE USING (auth.uid() = user_id);

-- Function: has_active_subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    sub_status TEXT;
BEGIN
    SELECT status INTO sub_status
    FROM user_subscriptions
    WHERE user_id = user_uuid
    AND status IN ('active', 'trialing')
    AND (current_period_end IS NULL OR current_period_end > NOW())
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN sub_status IS NOT NULL;
END;
$$;

-- Function: get_user_subscription
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_name TEXT,
    status TEXT,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.plan_name,
        us.status,
        us.current_period_end,
        us.cancel_at_period_end
    FROM user_subscriptions us
    WHERE us.user_id = user_uuid
    AND us.status IN ('active', 'trialing', 'past_due')
    ORDER BY us.created_at DESC
    LIMIT 1;
END;
$$;

-- Function: get_current_month_usage
CREATE OR REPLACE FUNCTION get_current_month_usage(user_uuid UUID)
RETURNS TABLE (
    receipt_uploads INTEGER,
    ai_content_suggestions INTEGER,
    month_year TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    current_month TEXT;
    usage_record RECORD;
BEGIN
    -- Get current month in YYYY-MM format
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Try to get existing usage record
    SELECT * INTO usage_record FROM user_usage 
    WHERE user_id = user_uuid AND month_year = current_month;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_usage (user_id, month_year, receipt_uploads, ai_content_suggestions)
        VALUES (user_uuid, current_month, 0, 0)
        RETURNING * INTO usage_record;
    END IF;
    
    -- Return the usage data
    RETURN QUERY
    SELECT 
        usage_record.receipt_uploads,
        usage_record.ai_content_suggestions,
        usage_record.month_year;
END;
$$;

-- Function: increment_receipt_uploads
CREATE OR REPLACE FUNCTION increment_receipt_uploads(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    current_month TEXT;
    current_count INTEGER;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get current count
    SELECT receipt_uploads INTO current_count
    FROM user_usage 
    WHERE user_id = user_uuid AND month_year = current_month;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_usage (user_id, month_year, receipt_uploads, ai_content_suggestions)
        VALUES (user_uuid, current_month, 1, 0);
        RETURN TRUE;
    END IF;
    
    -- Update existing record
    UPDATE user_usage 
    SET receipt_uploads = receipt_uploads + 1, updated_at = NOW()
    WHERE user_id = user_uuid AND month_year = current_month;
    
    RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_subscriptions TO service_role;
GRANT ALL ON user_usage TO service_role;
GRANT ALL ON notification_preferences TO service_role;
GRANT SELECT, UPDATE ON user_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_month_usage TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION increment_receipt_uploads TO authenticated;