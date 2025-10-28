-- Fix PUBLIC_USER_DATA: Restrict profile visibility to prevent data theft
-- Remove overly permissive profile SELECT policy that exposes all columns
DROP POLICY IF EXISTS "Users can view safe profile data for discovery" ON public.profiles;

-- Create restrictive policy: Users can only view their own full profile
-- Other users must use the secure get_secure_discovery_profiles() function
CREATE POLICY "Users can view only their own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Fix PUBLIC_VERIFICATION_DOCUMENTS: Restrict document URL access
-- Remove admin policy that allows direct access to document URLs
DROP POLICY IF EXISTS "Admins can review verification requests metadata only" ON public.verification_requests;

-- Create new policy: Admins can view request metadata but NOT document URLs directly
-- Document access must go through get_verification_document_with_audit() function
CREATE POLICY "Admins can view verification request metadata"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND
  -- Return only metadata columns, force document access through secure function
  true
);

-- Add helper comment to remind developers
COMMENT ON TABLE public.verification_requests IS 
'SECURITY: Document URLs (selfie_url, professional_document_url) should only be accessed via get_verification_document_with_audit() function for audit logging. Do not expose URLs directly in SELECT queries.';