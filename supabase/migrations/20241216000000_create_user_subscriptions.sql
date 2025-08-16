-- Create user_subscriptions table for managing Stripe subscriptions
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- Create RLS (Row Level Security) policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own subscriptions (for client-side status updates)
CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do everything (for webhook updates)
CREATE POLICY "Service role can manage all subscriptions" ON user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to get user's current subscription
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_subscriptions TO service_role;
GRANT SELECT, UPDATE ON user_subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription TO authenticated;

-- Create function to check if user has active subscription
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

GRANT EXECUTE ON FUNCTION has_active_subscription TO authenticated;