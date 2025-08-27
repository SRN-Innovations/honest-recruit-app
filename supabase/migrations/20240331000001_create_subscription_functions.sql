-- Function to increment jobs_posted count
CREATE OR REPLACE FUNCTION increment_jobs_posted()
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(jobs_posted, 0) + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement jobs_posted count
CREATE OR REPLACE FUNCTION decrement_jobs_posted()
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(COALESCE(jobs_posted, 0) - 1, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can post a job
CREATE OR REPLACE FUNCTION can_post_job(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  -- Get user's active subscription
  SELECT * INTO subscription_record
  FROM subscriptions
  WHERE user_id = user_uuid
    AND status = 'active'
    AND (current_period_end IS NULL OR current_period_end > NOW())
  LIMIT 1;

  -- If no subscription, cannot post
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- If unlimited plan, can always post
  IF subscription_record.job_limit = -1 THEN
    RETURN TRUE;
  END IF;

  -- Check if within job limit
  RETURN subscription_record.jobs_posted < subscription_record.job_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's subscription summary
CREATE OR REPLACE FUNCTION get_subscription_summary(user_uuid UUID)
RETURNS TABLE(
  plan_type TEXT,
  status TEXT,
  job_limit INTEGER,
  jobs_posted INTEGER,
  remaining_slots INTEGER,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.plan_type,
    s.status,
    s.job_limit,
    s.jobs_posted,
    CASE 
      WHEN s.job_limit = -1 THEN -1
      ELSE GREATEST(s.job_limit - s.jobs_posted, 0)
    END as remaining_slots,
    s.current_period_end,
    s.cancel_at_period_end
  FROM subscriptions s
  WHERE s.user_id = user_uuid
    AND s.status = 'active'
    AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
