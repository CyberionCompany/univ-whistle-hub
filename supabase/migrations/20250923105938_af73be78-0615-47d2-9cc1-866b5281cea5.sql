-- Fix the crypt function issue by enabling the pgcrypto extension and updating the function
-- Enable pgcrypto extension for crypt function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the get_anonymous_complaint function to use the correct crypt function
CREATE OR REPLACE FUNCTION public.get_anonymous_complaint(_anonymous_code text, _password_input text)
RETURNS TABLE(id uuid, protocol_code text, title text, description text, type complaint_type, status complaint_status, created_at timestamp with time zone, updated_at timestamp with time zone, admin_response text, responded_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  
  -- Verify password using crypt function (bcrypt compatible)
  IF NOT (crypt(_password_input, complaint_record.anonymous_password_hash) = complaint_record.anonymous_password_hash) THEN
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
$function$;