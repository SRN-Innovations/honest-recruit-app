-- Create role_skills table for normalized, role-scoped skills
CREATE TABLE IF NOT EXISTS public.role_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_type TEXT,
    skill_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure required columns exist
ALTER TABLE public.role_skills
    ADD COLUMN IF NOT EXISTS role_type TEXT,
    ADD COLUMN IF NOT EXISTS skill_name TEXT;

-- Ensure uniqueness constraint exists (case-sensitive; app normalizes writes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'role_skills_unique_per_role'
    ) THEN
        ALTER TABLE public.role_skills
        ADD CONSTRAINT role_skills_unique_per_role UNIQUE (role_type, skill_name);
    END IF;
END $$;

-- Create helper index for case-insensitive lookup per role
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' AND indexname = 'idx_role_skills_role_lower_skill'
    ) THEN
        EXECUTE 'CREATE INDEX idx_role_skills_role_lower_skill ON public.role_skills (role_type, LOWER(skill_name))';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.role_skills ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all role skills
DROP POLICY IF EXISTS "Allow read role_skills to all authenticated" ON public.role_skills;
CREATE POLICY "Allow read role_skills to all authenticated"
ON public.role_skills FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert role skills
DROP POLICY IF EXISTS "Allow insert role_skills to all authenticated" ON public.role_skills;
CREATE POLICY "Allow insert role_skills to all authenticated"
ON public.role_skills FOR INSERT
TO authenticated
WITH CHECK (true);
