-- Create notification preferences table
CREATE TABLE public.notification_preferences (
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

-- Enable Row Level Security
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notification preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification preferences" 
ON public.notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" 
ON public.notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences" 
ON public.notification_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- Create function to initialize notification preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create notification preferences when profile is created
CREATE TRIGGER on_profile_created_notification_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_notification_preferences();