-- Drop the insecure RLS policy that exposes non-anonymous complaints publicly
DROP POLICY IF EXISTS "Secure anonymous complaint access" ON public.complaints;

-- The remaining policies provide proper security:
-- 1. "Users can view their own complaints" - users see only their complaints (user_id = auth.uid())
-- 2. "Admins can view all complaints" - admins see all complaints (is_admin check)
-- 3. Anonymous complaints are only accessible via the secure get_anonymous_complaint() function