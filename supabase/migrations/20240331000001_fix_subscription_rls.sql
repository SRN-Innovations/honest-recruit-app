-- Fix RLS policies to allow webhook operations
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own one-off purchases" ON one_off_purchases;
DROP POLICY IF EXISTS "Users can update own one-off purchases" ON one_off_purchases;

-- Add policies that allow both user and service role access
CREATE POLICY "Allow subscription insert for users and service" ON subscriptions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Allow subscription update for users and service" ON subscriptions
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Allow one-off purchase insert for users and service" ON one_off_purchases
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Allow one-off purchase update for users and service" ON one_off_purchases
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.role() = 'service_role'
  );

-- Add service role policy for all operations (webhook needs this)
CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all one-off purchases" ON one_off_purchases
  FOR ALL USING (auth.role() = 'service_role');
