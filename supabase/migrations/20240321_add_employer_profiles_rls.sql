-- Enable RLS on employer_profiles table
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for inserting new employer profiles
CREATE POLICY "Users can insert their own employer profile" ON employer_profiles
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy for viewing employer profiles
CREATE POLICY "Users can view their own employer profile" ON employer_profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy for updating employer profiles
CREATE POLICY "Users can update their own employer profile" ON employer_profiles
FOR UPDATE
USING (auth.uid() = id); 