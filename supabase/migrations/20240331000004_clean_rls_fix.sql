-- Clean fix for RLS policies - allow users to read their own subscriptions
-- This migration will work regardless of existing policies

-- Drop all existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Allow subscription insert for users and service" ON subscriptions;
DROP POLICY IF EXISTS "Allow subscription update for users and service" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;

DROP POLICY IF EXISTS "Users can view own one-off purchases" ON one_off_purchases;
DROP POLICY IF EXISTS "Users can insert own one-off purchases" ON one_off_purchases;
DROP POLICY IF EXISTS "Users can update own one-off purchases" ON one_off_purchases;
DROP POLICY IF EXISTS "Allow one-off purchase insert for users and service" ON one_off_purchases;
DROP POLICY IF EXISTS "Allow one-off purchase update for users and service" ON one_off_purchases;
DROP POLICY IF EXISTS "Service role can manage all one-off purchases" ON one_off_purchases;

-- Create clean, simple policies
-- Users can read their own subscriptions (for client-side access)
CREATE POLICY "Users can read own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own one-off purchases
CREATE POLICY "Users can read own one-off purchases" ON one_off_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access one-off purchases" ON one_off_purchases
  FOR ALL USING (auth.role() = 'service_role');

