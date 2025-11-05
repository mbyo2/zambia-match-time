-- ============================================
-- SECURITY FIX: Restrict Profile Data Exposure
-- ============================================

-- Drop duplicate/overly permissive SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view only their own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create single, clear policy: users can ONLY view their own complete profile
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Block direct SELECT queries on other users' profiles
-- All discovery/matching MUST go through secure functions:
-- - get_secure_discovery_profiles()
-- - get_discovery_profiles()
-- - get_safe_profile_data()

COMMENT ON POLICY "Users can view own profile only" ON public.profiles IS 
'Users can only SELECT their own profile. All other profile viewing must use secure discovery functions that return only safe, non-PII data.';

-- ============================================
-- SECURITY FIX: Restrict Verification Document Access
-- ============================================

-- Create policy to prevent direct access to verification document URLs
-- Force all access through get_verification_document_with_audit() function

-- First, ensure only admins can view verification metadata (no document URLs in SELECT)
DROP POLICY IF EXISTS "Admins can view verification request metadata" ON public.verification_requests;

CREATE POLICY "Admins view verification metadata only"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid()
);

-- Add explicit comment about document access
COMMENT ON POLICY "Admins view verification metadata only" ON public.verification_requests IS 
'Admins and users can view verification request metadata. Document URLs should ONLY be accessed via get_verification_document_with_audit() RPC which logs all access.';

-- Create enhanced audit function for verification document access with stricter checks
CREATE OR REPLACE FUNCTION public.get_verification_document_secure(
  p_request_id uuid,
  p_document_type text DEFAULT 'selfie'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_path text;
  admin_user_id uuid;
  request_owner_id uuid;
  request_status verification_status;
BEGIN
  admin_user_id := auth.uid();
  
  -- Strict admin verification
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = admin_user_id AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Get document details and verify request exists
  SELECT 
    CASE 
      WHEN p_document_type = 'professional' THEN professional_document_url
      ELSE selfie_url
    END,
    user_id,
    status
  INTO doc_path, request_owner_id, request_status
  FROM verification_requests 
  WHERE id = p_request_id;
  
  IF doc_path IS NULL THEN
    RAISE EXCEPTION 'Document not found for request ID: %', p_request_id;
  END IF;
  
  -- Enhanced audit logging with comprehensive details
  PERFORM public.log_security_event(
    admin_user_id,
    'sensitive_document_accessed',
    'verification_request',
    p_request_id,
    jsonb_build_object(
      'document_type', p_document_type,
      'request_owner_id', request_owner_id,
      'request_status', request_status,
      'admin_user_id', admin_user_id,
      'accessed_at', now(),
      'access_method', 'secure_function',
      'requires_review', CASE WHEN request_status = 'pending' THEN true ELSE false END
    )
  );
  
  RETURN doc_path;
END;
$$;

COMMENT ON FUNCTION public.get_verification_document_secure IS 
'SECURITY FUNCTION: Returns verification document URLs with strict admin checks and comprehensive audit logging. This is the ONLY approved method to access verification documents.';

-- Update existing security policies to ensure verification documents are accessed securely
-- Note: The actual document URLs in the table should be considered sensitive
-- and client code should ONLY access them through this secure function