-- Migration: Add last_reset_date column to subscriptions table
-- This enables monthly job count resets for recurring subscriptions

-- Add the last_reset_date column
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS last_reset_date TIMESTAMP WITH TIME ZONE;

-- Set default values for existing records (use created_at as the initial reset date)
UPDATE subscriptions 
SET last_reset_date = created_at 
WHERE last_reset_date IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE subscriptions 
ALTER COLUMN last_reset_date SET NOT NULL;

-- Add index for efficient monthly reset queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_reset_date 
ON subscriptions(last_reset_date) 
WHERE status = 'active' AND plan_type != 'one_off';

-- Add comment to document the column purpose
COMMENT ON COLUMN subscriptions.last_reset_date IS 'Date when job count was last reset (monthly for recurring plans)';

