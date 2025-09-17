-- Phase 1: Critical Data Protection Fixes

-- Drop the overly permissive profiles RLS policy
DROP POLICY IF EXISTS "Users can view limited profile data for matching" ON public.profiles;

-- Create a secure profile viewing policy that only exposes safe data
CREATE POLICY "Users can view safe profile data for discovery" 
ON public.profiles 
FOR SELECT 
USING (
  (id = auth.uid()) OR 
  (
    is_active = true 
    AND id <> auth.uid() 
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks 
      WHERE blocker_id = auth.uid() AND blocked_id = profiles.id
    )
  )
);

-- Create a secure function to get only safe profile data for matching/discovery
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_id uuid)
RETURNS TABLE(
  id uuid,
  first_name text,
  age integer,
  bio text,
  occupation text,
  education text,
  general_city text,
  height_cm integer,
  interests text[],
  relationship_goals text[],
  is_verified boolean,
  last_active timestamp with time zone,
  has_accommodation_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return safe data, never expose email, full names, or precise locations
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    EXTRACT(YEAR FROM AGE(p.date_of_birth))::integer as age,
    COALESCE(p.bio, '') as bio,
    COALESCE(p.occupation, '') as occupation,
    COALESCE(p.education::text, '') as education,
    COALESCE(p.location_city, '') as general_city,
    p.height_cm,
    COALESCE(p.interests, ARRAY[]::text[]) as interests,
    COALESCE(array(SELECT unnest(p.relationship_goals))::text[], ARRAY[]::text[]) as relationship_goals,
    p.is_verified,
    COALESCE(p.last_active, p.created_at) as last_active,
    p.has_accommodation_available
  FROM profiles p
  WHERE p.id = profile_id
    AND p.is_active = true
    AND (
      p.id = auth.uid() OR 
      (
        p.id <> auth.uid() AND
        NOT EXISTS (
          SELECT 1 FROM user_blocks 
          WHERE blocker_id = auth.uid() AND blocked_id = p.id
        )
      )
    );
END;
$$;

-- Enhanced security for verification document access
CREATE OR REPLACE FUNCTION public.get_verification_document_url_secure(
  p_request_id uuid, 
  p_document_type text DEFAULT 'selfie'::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_path text;
  admin_user_id uuid;
BEGIN
  -- Get current user ID
  admin_user_id := auth.uid();
  
  -- Double-check admin status with explicit query
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = admin_user_id AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Get document path
  SELECT 
    CASE 
      WHEN p_document_type = 'professional' THEN professional_document_url
      ELSE selfie_url
    END
  INTO doc_path
  FROM verification_requests 
  WHERE id = p_request_id;
  
  IF doc_path IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Enhanced audit logging
  PERFORM public.log_security_event(
    admin_user_id,
    'verification_document_accessed',
    'verification_request',
    p_request_id,
    jsonb_build_object(
      'document_type', p_document_type,
      'document_path', doc_path,
      'accessed_at', now(),
      'ip_address', inet_client_addr(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    )
  );
  
  RETURN doc_path;
END;
$$;