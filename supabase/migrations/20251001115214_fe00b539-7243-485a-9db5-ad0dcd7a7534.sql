-- Enable pgcrypto extension for password hashing functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create complaints" ON public.complaints;

-- Create new policies that allow both anonymous and authenticated complaints
CREATE POLICY "Anyone can create anonymous complaints"
ON public.complaints
FOR INSERT
WITH CHECK (
  is_anonymous = true 
  AND anonymous_code IS NOT NULL 
  AND anonymous_password_hash IS NOT NULL
  AND user_id IS NULL
);

CREATE POLICY "Authenticated users can create non-anonymous complaints"
ON public.complaints
FOR INSERT
TO authenticated
WITH CHECK (
  is_anonymous = false 
  AND user_id = auth.uid()
);