-- Fix RLS policies to allow users to read their own subscriptions on client side
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own one-off purchases" ON one_off_purchases;

-- Add policies that allow users to read their own data
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can view own one-off purchases" ON one_off_purchases
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Ensure the service role can still access everything
-- (This should already exist from previous migration)
-- CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
--   FOR ALL USING (auth.role() = 'service_role');

