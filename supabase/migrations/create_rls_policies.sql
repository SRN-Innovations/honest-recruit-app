-- Enable RLS on candidate_profiles table
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for inserting new candidate profiles
CREATE POLICY "Users can insert their own candidate profile" ON candidate_profiles
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy for viewing candidate profiles (optional, depending on your needs)
CREATE POLICY "Users can view their own candidate profile" ON candidate_profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy for updating candidate profiles (optional, depending on your needs)
CREATE POLICY "Users can update their own candidate profile" ON candidate_profiles
FOR UPDATE
USING (auth.uid() = id); 