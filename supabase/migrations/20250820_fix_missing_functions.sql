-- Fix missing RPC functions for receipt counter functionality
-- This migration ensures all required functions are properly created

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

-- Function: can_upload_receipt
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_current_month_usage TO authenticated;
GRANT EXECUTE ON FUNCTION increment_receipt_uploads TO authenticated;
GRANT EXECUTE ON FUNCTION can_upload_receipt TO authenticated;