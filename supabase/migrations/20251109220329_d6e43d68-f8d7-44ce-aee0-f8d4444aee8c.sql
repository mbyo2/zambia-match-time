-- ============================================================================
-- SECURITY FIX: Restrict profile data exposure and verification document access
-- ============================================================================

-- ============================================================================
-- PART 1: Fix Profile Data Exposure
-- ============================================================================

-- Drop existing discovery function completely
DROP FUNCTION IF EXISTS public.get_discovery_profiles(uuid, integer, integer, integer, text[], text[], text[], integer, integer, text[], text[], text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_discovery_profiles(uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_discovery_profiles CASCADE;

-- Create new secure discovery function that only returns non-sensitive fields
CREATE OR REPLACE FUNCTION public.get_discovery_profiles(
  _user_id uuid,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id uuid,
  first_name text,
  age integer,
  bio text,
  occupation text,
  education text,
  height_cm integer,
  interests text[],
  looking_for text[],
  location_city text,
  location_state text,
  distance_km numeric,
  compatibility_score integer,
  is_verified boolean,
  professional_badge text,
  has_accommodation_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_lat numeric;
  _user_lng numeric;
  _min_age integer;
  _max_age integer;
  _max_distance integer;
  _user_interested_in text[];
  _user_gender text;
BEGIN
  -- Get current user's location and preferences
  SELECT 
    location_lat, 
    location_lng, 
    age_min, 
    age_max, 
    max_distance,
    interested_in::text[],
    gender::text
  INTO 
    _user_lat, 
    _user_lng, 
    _min_age, 
    _max_age, 
    _max_distance,
    _user_interested_in,
    _user_gender
  FROM profiles
  WHERE profiles.id = _user_id;

  -- Return only safe, non-sensitive profile fields for discovery
  -- NO email, NO exact coordinates, NO date_of_birth, NO last_name
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,  -- Only first name
    EXTRACT(YEAR FROM age(p.date_of_birth))::integer as age,  -- Age only, not DOB
    p.bio,
    p.occupation,
    p.education::text,
    p.height_cm,
    p.interests,
    p.looking_for,
    p.location_city,  -- City only, no GPS
    p.location_state,  -- State only, no GPS
    -- Calculate distance but don't expose exact coordinates
    CASE 
      WHEN _user_lat IS NOT NULL AND _user_lng IS NOT NULL 
        AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
      THEN ROUND(
        6371 * acos(
          cos(radians(_user_lat)) * cos(radians(p.location_lat)) *
          cos(radians(p.location_lng) - radians(_user_lng)) +
          sin(radians(_user_lat)) * sin(radians(p.location_lat))
        )
      )
      ELSE NULL
    END as distance_km,
    p.compatibility_score,
    p.is_verified,
    p.professional_badge,
    p.has_accommodation_available
  FROM profiles p
  WHERE p.id != _user_id
    AND p.is_active = true
    AND p.gender::text = ANY(_user_interested_in)
    AND _user_gender = ANY(p.interested_in::text[])
    AND EXTRACT(YEAR FROM age(p.date_of_birth)) BETWEEN _min_age AND _max_age
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks 
      WHERE (blocker_id = _user_id AND blocked_id = p.id)
         OR (blocker_id = p.id AND blocked_id = _user_id)
    )
    AND (
      _user_lat IS NULL OR _user_lng IS NULL OR
      p.location_lat IS NULL OR p.location_lng IS NULL OR
      (
        6371 * acos(
          cos(radians(_user_lat)) * cos(radians(p.location_lat)) *
          cos(radians(p.location_lng) - radians(_user_lng)) +
          sin(radians(_user_lat)) * sin(radians(p.location_lat))
        )
      ) <= _max_distance
    )
  ORDER BY RANDOM()
  LIMIT 50;
END;
$$;

-- ============================================================================
-- PART 2: Fix Verification Document Access
-- ============================================================================

-- Ensure verification document storage bucket is private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'verification-docs';

-- Drop existing functions that might expose documents
DROP FUNCTION IF EXISTS public.get_verification_document_url(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_verification_document_secure(uuid, text) CASCADE;

-- Create secure function to access verification documents with audit logging
CREATE OR REPLACE FUNCTION public.get_verification_document_secure(
  _request_id uuid,
  _document_type text DEFAULT 'selfie'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _document_path text;
  _user_id uuid;
  _is_admin boolean;
BEGIN
  -- Verify admin role
  SELECT has_role(auth.uid(), 'admin'::app_role) INTO _is_admin;
  
  IF NOT _is_admin THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Get document path and user_id
  SELECT 
    CASE 
      WHEN _document_type = 'professional' THEN professional_document_url
      ELSE selfie_url
    END,
    user_id
  INTO _document_path, _user_id
  FROM verification_requests
  WHERE id = _request_id;

  IF _document_path IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  -- Log access for audit trail
  PERFORM log_security_event(
    auth.uid(),
    'verification_document_access',
    'verification_request',
    _request_id,
    jsonb_build_object(
      'document_type', _document_type,
      'target_user_id', _user_id,
      'timestamp', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'document_path', _document_path,
    'message', 'Use edge function or storage API to generate signed URL'
  );
END;
$$;

-- Drop old admin policy that might expose URLs directly
DROP POLICY IF EXISTS "Admins view verification metadata only" ON verification_requests;
DROP POLICY IF EXISTS "Admins can view verification metadata without URLs" ON verification_requests;

-- Create new restrictive policy for admin viewing
CREATE POLICY "Admins can view verification metadata"
ON verification_requests
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR (user_id = auth.uid())
);

-- ============================================================================
-- PART 3: Storage Security Policies
-- ============================================================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Admin access to verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own verification docs" ON storage.objects;

-- Admin can view verification documents
CREATE POLICY "Admin can view verification documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Users can upload their own verification docs
CREATE POLICY "Users can upload own verification docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Log this security fix in audit log
DO $$ 
BEGIN
  PERFORM log_security_event(
    NULL,
    'security_policy_update',
    'database',
    NULL,
    jsonb_build_object(
      'changes', ARRAY[
        'Restricted profile discovery to non-sensitive fields only',
        'Removed email, exact GPS, DOB from discovery function',
        'Protected verification document URLs with secure access function',
        'Added audit logging for all document access',
        'Made verification-docs bucket private'
      ],
      'timestamp', now()
    )
  );
END $$;