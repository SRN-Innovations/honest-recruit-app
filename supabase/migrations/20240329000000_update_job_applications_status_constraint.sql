-- Update job_applications status constraint to include all statuses
ALTER TABLE public.job_applications 
DROP CONSTRAINT IF EXISTS job_applications_status_check;

ALTER TABLE public.job_applications 
ADD CONSTRAINT job_applications_status_check 
CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interviewed', 'rejected', 'accepted', 'withdrawn'));

-- Add comment to explain the constraint
COMMENT ON CONSTRAINT job_applications_status_check ON public.job_applications IS 'Allowed application statuses: pending, reviewed, shortlisted, interviewed, rejected, accepted, withdrawn';
