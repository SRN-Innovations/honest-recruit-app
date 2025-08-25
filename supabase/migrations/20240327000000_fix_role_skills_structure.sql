-- Drop and recreate role_skills table with proper structure
DROP TABLE IF EXISTS public.role_skills CASCADE;

CREATE TABLE public.role_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_type TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT role_skills_unique_per_role UNIQUE (role_type, skill_name)
);

-- Create helper index for case-insensitive lookup per role
CREATE INDEX idx_role_skills_role_lower_skill 
ON public.role_skills (role_type, LOWER(skill_name));

-- Enable RLS
ALTER TABLE public.role_skills ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all role skills
CREATE POLICY "Allow read role_skills to all authenticated"
ON public.role_skills FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert role skills
CREATE POLICY "Allow insert role_skills to all authenticated"
ON public.role_skills FOR INSERT
TO authenticated
WITH CHECK (true);
