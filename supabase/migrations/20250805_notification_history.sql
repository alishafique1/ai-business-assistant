-- Create notification history table to track sent notifications
CREATE TABLE public.notification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type TEXT NOT NULL, -- 'expense_alert', 'budget_warning', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Delivery details
  delivery_channel TEXT NOT NULL CHECK (delivery_channel IN ('email', 'push', 'sms')),
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'delivered')),
  delivery_error TEXT,
  
  -- Related data
  related_expense_id UUID,
  related_data JSONB DEFAULT '{}',
  
  -- Metadata
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notification history" 
ON public.notification_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage notification history" 
ON public.notification_history 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX idx_notification_history_type ON public.notification_history(notification_type);
CREATE INDEX idx_notification_history_status ON public.notification_history(delivery_status);
CREATE INDEX idx_notification_history_scheduled ON public.notification_history(scheduled_for);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_notification_history_updated_at
  BEFORE UPDATE ON public.notification_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();