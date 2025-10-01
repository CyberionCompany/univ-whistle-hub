-- Fix the get_anonymous_complaint function to properly use pgcrypto's crypt
DROP FUNCTION IF EXISTS public.get_anonymous_complaint(text, text);

CREATE OR REPLACE FUNCTION public.get_anonymous_complaint(_anonymous_code text, _password_input text)
RETURNS TABLE(
  id uuid,
  protocol_code text,
  title text,
  description text,
  type complaint_type,
  status complaint_status,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  admin_response text,
  responded_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  complaint_record complaints%ROWTYPE;
BEGIN
  -- Find the complaint by anonymous code
  SELECT * INTO complaint_record 
  FROM complaints 
  WHERE anonymous_code = _anonymous_code 
    AND is_anonymous = true;
  
  -- If complaint not found, return empty result
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Verify password using pgcrypto's crypt function with explicit schema
  IF NOT (extensions.crypt(_password_input, complaint_record.anonymous_password_hash) = complaint_record.anonymous_password_hash) THEN
    RETURN;
  END IF;
  
  -- Return the complaint data if authentication successful
  RETURN QUERY
  SELECT 
    complaint_record.id,
    complaint_record.protocol_code,
    complaint_record.title,
    complaint_record.description,
    complaint_record.type,
    complaint_record.status,
    complaint_record.created_at,
    complaint_record.updated_at,
    complaint_record.admin_response,
    complaint_record.responded_at;
END;
$$;