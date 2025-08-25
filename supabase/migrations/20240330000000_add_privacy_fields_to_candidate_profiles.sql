-- Add privacy and visibility fields to candidate_profiles table
ALTER TABLE public.candidate_profiles
ADD COLUMN open_for_work BOOLEAN DEFAULT true,
ADD COLUMN discoverable BOOLEAN DEFAULT true;

-- Add comments to explain the columns
COMMENT ON COLUMN public.candidate_profiles.open_for_work IS 'Indicates if the candidate is actively looking for work opportunities';
COMMENT ON COLUMN public.candidate_profiles.discoverable IS 'Controls if the candidate appears in employer search results';
