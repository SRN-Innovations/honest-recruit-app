-- Update existing candidate_profiles table to add missing columns
-- This migration handles the case where the table already exists but is missing columns

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add professional_summary column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'professional_summary') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN professional_summary TEXT;
    END IF;

    -- Add preferred_role_types column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'preferred_role_types') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN preferred_role_types JSONB DEFAULT '[]';
    END IF;

    -- Add preferred_employment_types column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'preferred_employment_types') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN preferred_employment_types JSONB DEFAULT '[]';
    END IF;

    -- Add preferred_location_types column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'preferred_location_types') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN preferred_location_types JSONB DEFAULT '[]';
    END IF;

    -- Add preferred_working_hours column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'preferred_working_hours') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN preferred_working_hours JSONB DEFAULT '[]';
    END IF;

    -- Add salary_expectations column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'salary_expectations') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN salary_expectations JSONB DEFAULT '{}';
    END IF;

    -- Add skills column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'skills') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN skills JSONB DEFAULT '[]';
    END IF;

    -- Add languages column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'languages') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN languages JSONB DEFAULT '[]';
    END IF;

    -- Add experience column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'experience') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN experience JSONB DEFAULT '[]';
    END IF;

    -- Add education column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'education') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN education JSONB DEFAULT '[]';
    END IF;

    -- Add certifications column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'certifications') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN certifications JSONB DEFAULT '[]';
    END IF;

    -- Add created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;

    -- Update address column to JSONB if it's currently TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'address' AND data_type = 'text') THEN
        -- First, add a temporary column
        ALTER TABLE public.candidate_profiles ADD COLUMN address_new JSONB;
        
        -- Convert existing TEXT addresses to JSONB format
        UPDATE public.candidate_profiles 
        SET address_new = CASE 
            WHEN address IS NULL OR address = '' THEN '{"street": "", "city": "", "state": "", "postalCode": "", "country": ""}'::jsonb
            ELSE '{"street": "", "city": "", "state": "", "postalCode": "", "country": ""}'::jsonb
        END;
        
        -- Drop the old column and rename the new one
        ALTER TABLE public.candidate_profiles DROP COLUMN address;
        ALTER TABLE public.candidate_profiles RENAME COLUMN address_new TO address;
        
        -- Set NOT NULL constraint
        ALTER TABLE public.candidate_profiles ALTER COLUMN address SET NOT NULL;
    END IF;

END $$;

-- Create indexes for better performance (only if they don't exist)
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

-- Create or replace the function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_candidate_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_candidate_profile_updated_at') THEN
        CREATE TRIGGER set_candidate_profile_updated_at
            BEFORE UPDATE ON public.candidate_profiles
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_candidate_profile_updated_at();
    END IF;
END $$;
