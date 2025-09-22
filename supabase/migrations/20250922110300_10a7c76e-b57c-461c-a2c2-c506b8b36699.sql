-- Fix critical security vulnerability: Anonymous complaints exposed to all users

-- First, drop the overly permissive policy that allows any user to view all anonymous complaints
DROP POLICY IF EXISTS "Anonymous users can view their complaints with code" ON public.complaints;

-- Create a secure function to handle anonymous complaint access with proper authentication
CREATE OR REPLACE FUNCTION public.get_anonymous_complaint(
  _anonymous_code text,
  _password_input text
)
RETURNS TABLE (
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
SET search_path = public
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
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_anonymous_complaint(text, text) TO authenticated, anon;

-- Create a more restrictive policy for anonymous complaints that requires proper authentication
-- This policy will now only allow viewing if the user goes through the secure function
CREATE POLICY "Secure anonymous complaint access" 
ON public.complaints 
FOR SELECT 
USING (
  -- Only allow direct access to non-anonymous complaints through existing policies
  -- Anonymous complaints can only be accessed via the secure function
  is_anonymous = false
);