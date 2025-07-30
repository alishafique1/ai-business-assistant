-- Add receipt tracking to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS receipt_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS receipt_count_reset_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free';

-- Add receipt tracking to expenses table  
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS has_receipt BOOLEAN DEFAULT false;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_source VARCHAR(50);

-- Create function to reset monthly receipt counts
CREATE OR REPLACE FUNCTION reset_monthly_receipt_counts()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET receipt_count = 0, 
      receipt_count_reset_date = CURRENT_DATE
  WHERE receipt_count_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Create function to check and increment receipt count
CREATE OR REPLACE FUNCTION check_and_increment_receipt_count(user_id_param UUID)
RETURNS TABLE(can_add_receipt BOOLEAN, current_count INTEGER, limit_reached BOOLEAN) AS $$
DECLARE
  user_plan VARCHAR(50);
  current_count_val INTEGER;
  monthly_limit INTEGER;
BEGIN
  -- Get user's current plan and receipt count
  SELECT subscription_plan, receipt_count 
  INTO user_plan, current_count_val
  FROM profiles 
  WHERE id = user_id_param;
  
  -- Set limits based on plan
  CASE user_plan
    WHEN 'free' THEN monthly_limit := 5;
    WHEN 'business_pro' THEN monthly_limit := 999999; -- Unlimited
    WHEN 'enterprise' THEN monthly_limit := 999999; -- Unlimited
    ELSE monthly_limit := 5; -- Default to free
  END CASE;
  
  -- Reset count if new month
  IF (SELECT receipt_count_reset_date FROM profiles WHERE id = user_id_param) < DATE_TRUNC('month', CURRENT_DATE) THEN
    UPDATE profiles 
    SET receipt_count = 0, 
        receipt_count_reset_date = CURRENT_DATE
    WHERE id = user_id_param;
    current_count_val := 0;
  END IF;
  
  -- Check if user can add receipt
  IF current_count_val < monthly_limit THEN
    -- Increment count
    UPDATE profiles 
    SET receipt_count = receipt_count + 1
    WHERE id = user_id_param;
    
    RETURN QUERY SELECT true, current_count_val + 1, false;
  ELSE
    RETURN QUERY SELECT false, current_count_val, true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_profiles_receipt_count ON profiles(receipt_count);
CREATE INDEX IF NOT EXISTS idx_expenses_has_receipt ON expenses(has_receipt);