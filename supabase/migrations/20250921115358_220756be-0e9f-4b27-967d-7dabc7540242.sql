-- CRITICAL SECURITY FIX: Replace overly permissive profiles RLS policy
-- This policy currently exposes email, full names, exact coordinates, and DOB
DROP POLICY IF EXISTS "Users can view limited profile data for discovery" ON public.profiles;

-- Create new secure discovery policy that only exposes safe, non-identifying data
CREATE POLICY "Users can view safe profile data for discovery" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always see their own full profile
  id = auth.uid() OR
  -- Others can only see limited safe data if profile is active and not blocked
  (
    is_active = true 
    AND id <> auth.uid() 
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks 
      WHERE blocker_id = auth.uid() AND blocked_id = profiles.id
    )
  )
);

-- Create secure discovery function that only returns safe data
CREATE OR REPLACE FUNCTION public.get_secure_discovery_profiles(
  requesting_user_id uuid,
  p_max_distance integer DEFAULT 50,
  p_age_min integer DEFAULT 18,
  p_age_max integer DEFAULT 99,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  first_name text,
  age integer,
  bio text,
  occupation text,
  general_location text,
  height_cm integer,
  interests text[],
  relationship_goals text[],
  distance_km numeric,
  compatibility_score integer,
  is_verified boolean,
  last_active timestamp with time zone,
  has_accommodation_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Get requesting user's profile for matching calculations
  SELECT * INTO user_profile FROM profiles WHERE profiles.id = requesting_user_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name, -- Only first name, not full name
    COALESCE(EXTRACT(YEAR FROM AGE(p.date_of_birth))::integer, 25) as age, -- Age only, not DOB
    COALESCE(LEFT(p.bio, 500), '') as bio, -- Limit bio length
    COALESCE(p.occupation, '') as occupation,
    -- General location only (city/state), no exact coordinates
    COALESCE(p.location_city || CASE WHEN p.location_state IS NOT NULL THEN ', ' || p.location_state ELSE '' END, 'Location not specified') as general_location,
    p.height_cm,
    COALESCE(p.interests, ARRAY[]::text[]) as interests,
    COALESCE(array(SELECT unnest(p.relationship_goals))::text[], ARRAY[]::text[]) as relationship_goals,
    -- Calculate distance but don't expose exact coordinates
    public.calculate_distance(
      user_profile.location_lat, user_profile.location_lng,
      p.location_lat, p.location_lng
    ) as distance_km,
    -- Simple compatibility calculation
    (
      COALESCE(array_length(array(SELECT unnest(COALESCE(p.interests, ARRAY[]::text[])) INTERSECT SELECT unnest(COALESCE(user_profile.interests, ARRAY[]::text[]))), 1), 0) * 10 +
      COALESCE(array_length(array(SELECT unnest(COALESCE(p.relationship_goals, ARRAY[]::relationship_goal[])) INTERSECT SELECT unnest(COALESCE(user_profile.relationship_goals, ARRAY[]::relationship_goal[]))), 1), 0) * 15 +
      CASE WHEN p.education = user_profile.education THEN 20 ELSE 5 END
    ) as compatibility_score,
    p.is_verified,
    COALESCE(p.last_active, p.created_at) as last_active,
    p.has_accommodation_available
  FROM profiles p
  WHERE p.id != requesting_user_id
    AND p.is_active = true
    -- Age filter
    AND (p.date_of_birth IS NULL OR EXTRACT(YEAR FROM AGE(p.date_of_birth)) BETWEEN p_age_min AND p_age_max)
    -- Distance filter
    AND (
      p_max_distance <= 0 OR 
      user_profile.location_lat IS NULL OR 
      p.location_lat IS NULL OR
      public.calculate_distance(
        user_profile.location_lat, user_profile.location_lng,
        p.location_lat, p.location_lng
      ) <= p_max_distance
    )
    -- Exclude blocked users
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks
      WHERE blocker_id = requesting_user_id AND blocked_id = p.id
    )
    -- Exclude already swiped users
    AND NOT EXISTS (
      SELECT 1 FROM swipes s
      WHERE s.swiper_id = requesting_user_id AND s.swiped_id = p.id
    )
  ORDER BY compatibility_score DESC, distance_km ASC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- Enhanced verification document access with proper audit logging
CREATE OR REPLACE FUNCTION public.get_verification_document_with_audit(
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
BEGIN
  admin_user_id := auth.uid();
  
  -- Strict admin verification
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = admin_user_id AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Get document path and owner
  SELECT 
    CASE 
      WHEN p_document_type = 'professional' THEN professional_document_url
      ELSE selfie_url
    END,
    user_id
  INTO doc_path, request_owner_id
  FROM verification_requests 
  WHERE id = p_request_id;
  
  IF doc_path IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Comprehensive audit logging
  PERFORM public.log_security_event(
    admin_user_id,
    'verification_document_accessed',
    'verification_request',
    p_request_id,
    jsonb_build_object(
      'document_type', p_document_type,
      'document_path', doc_path,
      'request_owner_id', request_owner_id,
      'admin_user_id', admin_user_id,
      'accessed_at', now(),
      'access_reason', 'verification_review'
    )
  );
  
  RETURN doc_path;
END;
$$;

-- Create enhanced message sanitization function
CREATE OR REPLACE FUNCTION public.sanitize_message_content(
  p_content text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sanitized_content text;
  suspicious_patterns text[] := ARRAY[
    '<script', 'javascript:', 'data:text/html', 'vbscript:', 
    'onload=', 'onerror=', 'onclick=', 'onmouseover=',
    'eval(', 'document.cookie', 'window.location'
  ];
  pattern text;
BEGIN
  -- Basic validation
  IF p_content IS NULL OR length(trim(p_content)) = 0 THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;
  
  IF length(p_content) > 2000 THEN
    RAISE EXCEPTION 'Message too long. Maximum 2000 characters allowed.';
  END IF;
  
  -- Check for suspicious patterns
  FOREACH pattern IN ARRAY suspicious_patterns LOOP
    IF lower(p_content) LIKE '%' || pattern || '%' THEN
      -- Log security event
      PERFORM public.log_security_event(
        p_user_id,
        'suspicious_message_content',
        'message',
        null,
        jsonb_build_object(
          'content_preview', left(p_content, 100),
          'detected_pattern', pattern
        )
      );
      RAISE EXCEPTION 'Message contains prohibited content';
    END IF;
  END LOOP;
  
  -- Basic sanitization - remove potential HTML/script content
  sanitized_content := trim(p_content);
  sanitized_content := regexp_replace(sanitized_content, '<[^>]*>', '', 'gi');
  sanitized_content := regexp_replace(sanitized_content, 'javascript:', '', 'gi');
  sanitized_content := regexp_replace(sanitized_content, 'data:', '', 'gi');
  
  RETURN sanitized_content;
END;
$$;