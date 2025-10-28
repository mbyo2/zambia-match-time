-- Fix 1: Add missing RLS policies for profile-photos and profile-videos storage buckets
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profile videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile videos" ON storage.objects;

-- Profile-photos bucket policies
CREATE POLICY "Users can upload own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

-- Profile-videos bucket policies  
CREATE POLICY "Users can upload own profile videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own profile videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own profile videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view profile videos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-videos');

-- Fix 2: Restrict profiles table RLS to prevent exposure of sensitive data
-- The existing policy "Users can view only their own full profile" allows viewing full profiles
-- We need to ensure other users cannot see sensitive fields like email, exact coordinates, etc.
-- Drop the overly broad policy
DROP POLICY IF EXISTS "Users can view safe profile data for discovery" ON profiles;

-- Note: The existing "Users can view only their own full profile" policy already restricts 
-- viewing to own profile or through secure functions. The app should use get_secure_discovery_profiles()
-- which returns only safe fields (first name, age, general location, etc.)

-- Fix 3: Add audit function for verification document access
CREATE OR REPLACE FUNCTION public.audit_verification_document_access(
  p_request_id uuid,
  p_document_type text,
  p_admin_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.log_security_event(
    p_admin_user_id,
    'verification_document_accessed',
    'verification_request',
    p_request_id,
    jsonb_build_object(
      'document_type', p_document_type,
      'timestamp', now(),
      'admin_user_id', p_admin_user_id,
      'access_method', 'admin_panel'
    )
  );
END;
$$;

COMMENT ON FUNCTION public.audit_verification_document_access IS 
'Audits all access to verification documents for compliance and security monitoring.';