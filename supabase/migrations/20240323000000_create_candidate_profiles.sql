-- Drop existing table if it exists to ensure clean schema
DROP TABLE IF EXISTS public.candidate_profiles CASCADE;

-- Create candidate_profiles table with comprehensive fields
CREATE TABLE public.candidate_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    address TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    nationality TEXT NOT NULL,
    right_to_work JSONB NOT NULL DEFAULT '{}',
    professional_summary TEXT,
    preferred_role_types JSONB DEFAULT '[]',
    preferred_employment_types JSONB DEFAULT '[]',
    preferred_location_types JSONB DEFAULT '[]',
    preferred_working_hours JSONB DEFAULT '[]',
    salary_expectations JSONB DEFAULT '{}',
    skills JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    experience JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for candidates to view their own profile
CREATE POLICY "Candidates can view their own profile"
    ON public.candidate_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy for candidates to insert their own profile
CREATE POLICY "Candidates can insert their own profile"
    ON public.candidate_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy for candidates to update their own profile
CREATE POLICY "Candidates can update their own profile"
    ON public.candidate_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy for employers to view candidate profiles (for job matching)
CREATE POLICY "Employers can view candidate profiles for job matching"
    ON public.candidate_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.user_type = 'employer'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_candidate_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_candidate_profile_updated_at
    BEFORE UPDATE ON public.candidate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_candidate_profile_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_preferred_role_types ON public.candidate_profiles USING GIN (preferred_role_types);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_skills ON public.candidate_profiles USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_location_types ON public.candidate_profiles USING GIN (preferred_location_types);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_employment_types ON public.candidate_profiles USING GIN (preferred_employment_types);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_working_hours ON public.candidate_profiles USING GIN (preferred_working_hours);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_salary_expectations ON public.candidate_profiles USING GIN (salary_expectations);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_languages ON public.candidate_profiles USING GIN (languages);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_experience ON public.candidate_profiles USING GIN (experience);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_education ON public.candidate_profiles USING GIN (education);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_certifications ON public.candidate_profiles USING GIN (certifications);
