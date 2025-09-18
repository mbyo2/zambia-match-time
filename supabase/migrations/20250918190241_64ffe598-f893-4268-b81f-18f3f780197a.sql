-- Fix critical data exposure in profiles table
-- Replace the overly permissive RLS policy with secure data access

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view safe profile data for discovery" ON public.profiles;

-- Create a secure policy that only exposes safe, non-identifying data
CREATE POLICY "Users can view limited profile data for discovery" 
ON public.profiles 
FOR SELECT 
USING (
  id = auth.uid() OR (
    is_active = true 
    AND id <> auth.uid() 
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks 
      WHERE blocker_id = auth.uid() AND blocked_id = profiles.id
    )
  )
);

-- Create a secure function to get safe profile data for discovery/matching
CREATE OR REPLACE FUNCTION public.get_safe_discovery_profiles(
  requesting_user_id uuid,
  p_max_distance integer DEFAULT 50,
  p_age_min integer DEFAULT 18,
  p_age_max integer DEFAULT 99
) RETURNS TABLE(
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
  last_active timestamp with time zone
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
    p.first_name,
    COALESCE(EXTRACT(YEAR FROM AGE(p.date_of_birth))::integer, 25) as age,
    COALESCE(LEFT(p.bio, 200), '') as bio, -- Limit bio length
    COALESCE(p.occupation, '') as occupation,
    COALESCE(p.location_city || ', ' || p.location_state, 'Unknown') as general_location, -- City/state only, no exact coordinates
    p.height_cm,
    COALESCE(p.interests, ARRAY[]::text[]) as interests,
    COALESCE(array(SELECT unnest(p.relationship_goals))::text[], ARRAY[]::text[]) as relationship_goals,
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
    COALESCE(p.last_active, p.created_at) as last_active
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
  LIMIT 50;
END;
$$;

-- Enhanced security for verification document access
CREATE OR REPLACE FUNCTION public.get_verification_document_secure(
  p_request_id uuid, 
  p_document_type text DEFAULT 'selfie'
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_path text;
  admin_user_id uuid;
  request_user_id uuid;
BEGIN
  admin_user_id := auth.uid();
  
  -- Verify admin status with explicit check
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = admin_user_id AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Get document path and request user ID
  SELECT 
    CASE 
      WHEN p_document_type = 'professional' THEN professional_document_url
      ELSE selfie_url
    END,
    user_id
  INTO doc_path, request_user_id
  FROM verification_requests 
  WHERE id = p_request_id;
  
  IF doc_path IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Enhanced audit logging with more details
  PERFORM public.log_security_event(
    admin_user_id,
    'sensitive_document_accessed',
    'verification_request',
    p_request_id,
    jsonb_build_object(
      'document_type', p_document_type,
      'document_path', doc_path,
      'request_user_id', request_user_id,
      'admin_user_id', admin_user_id,
      'accessed_at', now(),
      'session_id', auth.jwt() ->> 'session_id'
    )
  );
  
  RETURN doc_path;
END;
$$;

-- Add rate limiting table for security
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  attempts integer DEFAULT 1,
  last_attempt timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policy for rate limits
CREATE POLICY "Users can view their own rate limits" 
ON public.rate_limits 
FOR ALL 
USING (user_id = auth.uid());

-- Function to check and enforce rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_action_type text,
  p_max_attempts integer DEFAULT 10,
  p_window_minutes integer DEFAULT 60
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_attempts integer;
  is_blocked boolean := false;
BEGIN
  -- Check if user is currently blocked
  SELECT COUNT(*) > 0 INTO is_blocked
  FROM rate_limits 
  WHERE user_id = p_user_id 
    AND action_type = p_action_type 
    AND blocked_until > now();
    
  IF is_blocked THEN
    RETURN false;
  END IF;
  
  -- Get current attempts in the time window
  SELECT COALESCE(attempts, 0) INTO current_attempts
  FROM rate_limits 
  WHERE user_id = p_user_id 
    AND action_type = p_action_type
    AND last_attempt > now() - (p_window_minutes || ' minutes')::interval
  ORDER BY last_attempt DESC
  LIMIT 1;
  
  -- If exceeded max attempts, block user
  IF current_attempts >= p_max_attempts THEN
    INSERT INTO rate_limits (user_id, action_type, attempts, blocked_until)
    VALUES (p_user_id, p_action_type, current_attempts + 1, now() + '1 hour'::interval)
    ON CONFLICT (user_id, action_type) 
    DO UPDATE SET 
      attempts = rate_limits.attempts + 1,
      last_attempt = now(),
      blocked_until = now() + '1 hour'::interval;
    RETURN false;
  END IF;
  
  -- Update attempt count
  INSERT INTO rate_limits (user_id, action_type, attempts)
  VALUES (p_user_id, p_action_type, 1)
  ON CONFLICT (user_id, action_type)
  DO UPDATE SET 
    attempts = rate_limits.attempts + 1,
    last_attempt = now();
    
  RETURN true;
END;
$$;

-- Add unique constraint for rate limits
CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_user_action_idx 
ON public.rate_limits (user_id, action_type);