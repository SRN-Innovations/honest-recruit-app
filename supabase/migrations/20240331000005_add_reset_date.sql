-- Add last_reset_date field to subscriptions table for monthly job count resets
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

