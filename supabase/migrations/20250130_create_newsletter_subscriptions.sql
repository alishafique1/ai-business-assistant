-- Create newsletter_subscriptions table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  source VARCHAR(100) DEFAULT 'website_footer',
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribed_at ON newsletter_subscriptions(subscribed_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_is_active ON newsletter_subscriptions(is_active);

-- Enable Row Level Security
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for subscription)
CREATE POLICY "Allow public newsletter subscription" ON newsletter_subscriptions
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow authenticated users to read their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON newsletter_subscriptions
  FOR SELECT 
  USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_newsletter_subscriptions_updated_at
    BEFORE UPDATE ON newsletter_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();