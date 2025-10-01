-- Create function to create anonymous complaint with proper password hashing
CREATE OR REPLACE FUNCTION public.create_anonymous_complaint(
  _title text,
  _description text,
  _type complaint_type,
  _password text
)
RETURNS TABLE(
  protocol_code text,
  anonymous_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_anonymous_code uuid;
  new_protocol_code text;
  password_hash text;
BEGIN
  -- Generate unique anonymous code
  new_anonymous_code := gen_random_uuid();
  
  -- Hash password using pgcrypto
  password_hash := extensions.crypt(_password, extensions.gen_salt('bf'));
  
  -- Insert complaint
  INSERT INTO complaints (
    title,
    description,
    type,
    is_anonymous,
    anonymous_code,
    anonymous_password_hash
  ) VALUES (
    _title,
    _description,
    _type,
    true,
    new_anonymous_code::text,
    password_hash
  )
  RETURNING complaints.protocol_code INTO new_protocol_code;
  
  -- Return the codes
  RETURN QUERY
  SELECT new_protocol_code, new_anonymous_code::text;
END;
$$;