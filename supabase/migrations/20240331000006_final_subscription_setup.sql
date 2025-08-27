-- Final subscription setup migration
-- This migration consolidates all subscription-related changes

-- Add last_reset_date field to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS last_reset_date TIMESTAMP WITH TIME ZONE;

-- Update existing subscriptions to have a last_reset_date based on created_at
UPDATE subscriptions 
SET last_reset_date = created_at 
WHERE last_reset_date IS NULL;

-- Make last_reset_date NOT NULL after setting default values
ALTER TABLE subscriptions 
ALTER COLUMN last_reset_date SET NOT NULL;

-- Add index for efficient monthly reset queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_reset_date 
ON subscriptions(last_reset_date) 
WHERE status = 'active' AND plan_type != 'one_off';

-- Ensure we have the correct RLS policies
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow subscription insert for users and service" ON subscriptions;
DROP POLICY IF EXISTS "Allow subscription update for users and service" ON subscriptions;
DROP POLICY IF EXISTS "Allow subscription select for users and service" ON subscriptions;
DROP POLICY IF EXISTS "Allow subscription delete for users and service" ON subscriptions;

-- Create clean RLS policies
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

CREATE POLICY "Allow subscription select for users and service" ON subscriptions
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Allow subscription delete for users and service" ON subscriptions
  FOR DELETE USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

-- Similar policies for one_off_purchases
DROP POLICY IF EXISTS "Allow one_off insert for users and service" ON one_off_purchases;
DROP POLICY IF EXISTS "Allow one_off update for users and service" ON one_off_purchases;
DROP POLICY IF EXISTS "Allow one_off select for users and service" ON one_off_purchases;
DROP POLICY IF EXISTS "Allow one_off delete for users and service" ON one_off_purchases;

CREATE POLICY "Allow one_off insert for users and service" ON one_off_purchases
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Allow one_off update for users and service" ON one_off_purchases
  FOR UPDATE USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Allow one_off select for users and service" ON one_off_purchases
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Allow one_off delete for users and service" ON one_off_purchases
  FOR DELETE USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

