-- Run this in your Supabase SQL Editor to create the newsletter subscriptions table

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribed_at ON newsletter_subscriptions(subscribed_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_is_active ON newsletter_subscriptions(is_active);

-- Disable Row Level Security for now (easier setup)
-- You can enable it later with proper policies if needed
ALTER TABLE newsletter_subscriptions DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want RLS enabled, use these policies instead:
-- ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow public newsletter subscription" ON newsletter_subscriptions;
-- DROP POLICY IF EXISTS "Allow public to read subscriptions" ON newsletter_subscriptions;
-- CREATE POLICY "Allow public newsletter subscription" ON newsletter_subscriptions FOR INSERT TO anon WITH CHECK (true);
-- CREATE POLICY "Allow public to read subscriptions" ON newsletter_subscriptions FOR SELECT TO anon USING (true);

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