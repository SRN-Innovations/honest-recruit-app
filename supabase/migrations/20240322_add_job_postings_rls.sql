-- Enable RLS on job_postings table (if not already enabled)
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Employers can view their own job postings" ON job_postings;
DROP POLICY IF EXISTS "Employers can insert their own job postings" ON job_postings;
DROP POLICY IF EXISTS "Employers can update their own job postings" ON job_postings;
DROP POLICY IF EXISTS "Employers can delete their own job postings" ON job_postings;
DROP POLICY IF EXISTS "Candidates can view active job postings" ON job_postings;
DROP POLICY IF EXISTS "Job applications can reference job postings" ON job_postings;

-- Policy for employers to view their own job postings
CREATE POLICY "Employers can view their own job postings" ON job_postings
FOR SELECT
USING (auth.uid() = employer_id);

-- Policy for employers to insert new job postings
CREATE POLICY "Employers can insert their own job postings" ON job_postings
FOR INSERT
WITH CHECK (auth.uid() = employer_id);

-- Policy for employers to update their own job postings
CREATE POLICY "Employers can update their own job postings" ON job_postings
FOR UPDATE
USING (auth.uid() = employer_id);

-- Policy for employers to delete their own job postings
CREATE POLICY "Employers can delete their own job postings" ON job_postings
FOR DELETE
USING (auth.uid() = employer_id);

-- Policy for candidates to view active job postings (optional, for job search)
CREATE POLICY "Candidates can view active job postings" ON job_postings
FOR SELECT
USING (status = 'active');

-- Policy for job applications to reference job postings
CREATE POLICY "Job applications can reference job postings" ON job_postings
FOR SELECT
USING (true);
