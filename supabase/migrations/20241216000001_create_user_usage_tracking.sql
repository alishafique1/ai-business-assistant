-- Create user_usage table for tracking feature usage limits
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format: "2024-12"
    receipt_uploads INTEGER DEFAULT 0,
    ai_content_suggestions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_month_year ON user_usage(month_year);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month_year);

-- Create RLS (Row Level Security) policies
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own usage (for client-side updates)
CREATE POLICY "Users can update own usage" ON user_usage
    FOR ALL USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can manage all usage" ON user_usage
    FOR ALL USING (auth.role() = 'service_role');

-- Function to get or create current month usage
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

-- Function to increment receipt upload count
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

-- Function to increment AI content suggestions count
CREATE OR REPLACE FUNCTION increment_ai_content_suggestions(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    current_month TEXT;
    current_count INTEGER;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get current count
    SELECT ai_content_suggestions INTO current_count
    FROM user_usage 
    WHERE user_id = user_uuid AND month_year = current_month;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_usage (user_id, month_year, receipt_uploads, ai_content_suggestions)
        VALUES (user_uuid, current_month, 0, 1);
        RETURN TRUE;
    END IF;
    
    -- Update existing record
    UPDATE user_usage 
    SET ai_content_suggestions = ai_content_suggestions + 1, updated_at = NOW()
    WHERE user_id = user_uuid AND month_year = current_month;
    
    RETURN TRUE;
END;
$$;

-- Function to check if user can upload receipt (has not exceeded limit)
CREATE OR REPLACE FUNCTION can_upload_receipt(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    current_month TEXT;
    current_count INTEGER;
    has_subscription BOOLEAN;
BEGIN
    -- Check if user has active subscription
    SELECT has_active_subscription(user_uuid) INTO has_subscription;
    
    -- If user has subscription, they have unlimited uploads
    IF has_subscription THEN
        RETURN TRUE;
    END IF;
    
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get current count for free users
    SELECT receipt_uploads INTO current_count
    FROM user_usage 
    WHERE user_id = user_uuid AND month_year = current_month;
    
    -- If no record exists, user can upload (first upload)
    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;
    
    -- Check if under limit (5 for free users)
    RETURN current_count < 5;
END;
$$;

-- Function to check if user can use AI content suggestions
CREATE OR REPLACE FUNCTION can_use_ai_content(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    current_month TEXT;
    current_count INTEGER;
    has_subscription BOOLEAN;
BEGIN
    -- Check if user has active subscription
    SELECT has_active_subscription(user_uuid) INTO has_subscription;
    
    -- If user has subscription, they have unlimited usage
    IF has_subscription THEN
        RETURN TRUE;
    END IF;
    
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get current count for free users
    SELECT ai_content_suggestions INTO current_count
    FROM user_usage 
    WHERE user_id = user_uuid AND month_year = current_month;
    
    -- If no record exists, user can use it (first use)
    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;
    
    -- Check if under limit (5 for free users)
    RETURN current_count < 5;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_usage TO service_role;
GRANT SELECT, INSERT, UPDATE ON user_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_month_usage TO authenticated;
GRANT EXECUTE ON FUNCTION increment_receipt_uploads TO authenticated;
GRANT EXECUTE ON FUNCTION increment_ai_content_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION can_upload_receipt TO authenticated;
GRANT EXECUTE ON FUNCTION can_use_ai_content TO authenticated;