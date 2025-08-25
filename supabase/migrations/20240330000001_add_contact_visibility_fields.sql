-- Add contact visibility fields to candidate_profiles table
ALTER TABLE public.candidate_profiles
ADD COLUMN show_email_in_search BOOLEAN DEFAULT false,
ADD COLUMN show_phone_in_search BOOLEAN DEFAULT false;

-- Add comments to explain the columns
COMMENT ON COLUMN public.candidate_profiles.show_email_in_search IS 'Controls if email is visible to employers in search results';
COMMENT ON COLUMN public.candidate_profiles.show_phone_in_search IS 'Controls if phone number is visible to employers in search results';
