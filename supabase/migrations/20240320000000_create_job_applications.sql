-- Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'interviewed', 'rejected', 'accepted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resume_url TEXT,
    cover_letter TEXT,
    notes TEXT,
    UNIQUE(candidate_id, job_id)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Policy for candidates to view their own applications
DROP POLICY IF EXISTS "Candidates can view their own applications" ON public.job_applications;
CREATE POLICY "Candidates can view their own applications"
    ON public.job_applications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = candidate_id);

-- Policy for candidates to create applications
DROP POLICY IF EXISTS "Candidates can create applications" ON public.job_applications;
CREATE POLICY "Candidates can create applications"
    ON public.job_applications
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = candidate_id);

-- Policy for candidates to update their own applications
DROP POLICY IF EXISTS "Candidates can update their own applications" ON public.job_applications;
CREATE POLICY "Candidates can update their own applications"
    ON public.job_applications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = candidate_id)
    WITH CHECK (auth.uid() = candidate_id);

-- Policy for employers to view applications for their job postings
DROP POLICY IF EXISTS "Employers can view applications for their job postings" ON public.job_applications;
CREATE POLICY "Employers can view applications for their job postings"
    ON public.job_applications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.job_postings
            WHERE job_postings.id = job_applications.job_id
            AND job_postings.employer_id = auth.uid()
        )
    );

-- Policy for employers to update applications for their job postings
DROP POLICY IF EXISTS "Employers can update applications for their job postings" ON public.job_applications;
CREATE POLICY "Employers can update applications for their job postings"
    ON public.job_applications
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.job_postings
            WHERE job_postings.id = job_applications.job_id
            AND job_postings.employer_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.job_applications;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 