-- Add match_score column to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN match_score INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN public.job_applications.match_score IS 'Match score (0-100) calculated when candidate applied for the job';
