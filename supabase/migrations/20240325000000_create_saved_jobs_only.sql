-- Create saved_jobs table only
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(candidate_id, job_id)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Policy for candidates to view their own saved jobs
DROP POLICY IF EXISTS "Candidates can view their own saved jobs" ON public.saved_jobs;
CREATE POLICY "Candidates can view their own saved jobs"
    ON public.saved_jobs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = candidate_id);

-- Policy for candidates to save jobs
DROP POLICY IF EXISTS "Candidates can save jobs" ON public.saved_jobs;
CREATE POLICY "Candidates can save jobs"
    ON public.saved_jobs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = candidate_id);

-- Policy for candidates to unsave jobs
DROP POLICY IF EXISTS "Candidates can unsave jobs" ON public.saved_jobs;
CREATE POLICY "Candidates can unsave jobs"
    ON public.saved_jobs
    FOR DELETE
    TO authenticated
    USING (auth.uid() = candidate_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_saved_jobs_candidate_id ON public.saved_jobs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs(job_id);
