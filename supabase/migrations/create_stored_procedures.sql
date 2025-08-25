CREATE OR REPLACE FUNCTION create_candidate_profiles(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone_number TEXT,
  p_address TEXT,
  p_date_of_birth DATE,
  p_gender TEXT,
  p_nationality TEXT,
  p_right_to_work JSONB
) RETURNS VOID AS $$
BEGIN
  -- Verify the auth user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Start transaction
  BEGIN
    -- Create user profile
    INSERT INTO user_profiles (id, user_type)
    VALUES (p_user_id, 'candidate');

    -- Create candidate profile
    INSERT INTO candidate_profiles (
      id,
      full_name,
      email,
      phone_number,
      address,
      date_of_birth,
      gender,
      nationality,
      right_to_work
    ) VALUES (
      p_user_id,
      p_full_name,
      p_email,
      p_phone_number,
      p_address,
      p_date_of_birth,
      p_gender,
      p_nationality,
      p_right_to_work
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RAISE EXCEPTION 'Failed to create profiles: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 