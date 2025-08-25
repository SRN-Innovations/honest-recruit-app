-- Add policy to allow candidates to view employer profiles for job matching
DROP POLICY IF EXISTS "Candidates can view employer profiles for job matching" ON employer_profiles;
CREATE POLICY "Candidates can view employer profiles for job matching"
ON employer_profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'candidate'
    )
);
