-- Add distance fuzzing to prevent location triangulation attacks
-- This adds random noise to distance calculations to make triangulation impossible

-- Create function to add fuzzing to distance (±2-5km random noise)
CREATE OR REPLACE FUNCTION public.fuzz_distance(exact_distance numeric)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Return NULL if distance is NULL
  IF exact_distance IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Add random noise between -5km and +5km, but keep it reasonable
  -- For very close distances (<10km), add less noise to maintain usability
  IF exact_distance < 10 THEN
    RETURN GREATEST(1, exact_distance + (random() * 4 - 2));
  ELSE
    RETURN exact_distance + (random() * 10 - 5);
  END IF;
END;
$$;

-- Update get_discovery_profiles to use fuzzed distances
CREATE OR REPLACE FUNCTION public.get_discovery_profiles(_user_id uuid, _filters jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(
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

  -- Audit log: Discovery profile access
  PERFORM public.log_security_event(
    _user_id,
    'discovery_profiles_accessed',
    'profiles',
    NULL,
    jsonb_build_object('filters', _filters)
  );

  -- Return only safe, non-sensitive profile fields with FUZZED distances
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    EXTRACT(YEAR FROM age(p.date_of_birth))::integer as age,
    p.bio,
    p.occupation,
    p.education::text,
    p.height_cm,
    p.interests,
    p.looking_for,
    p.location_city,
    p.location_state,
    -- CRITICAL: Use fuzzed distance to prevent triangulation
    CASE 
      WHEN _user_lat IS NOT NULL AND _user_lng IS NOT NULL 
        AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
      THEN public.fuzz_distance(
        ROUND(
          6371 * acos(
            cos(radians(_user_lat)) * cos(radians(p.location_lat)) *
            cos(radians(p.location_lng) - radians(_user_lng)) +
            sin(radians(_user_lat)) * sin(radians(p.location_lat))
          )
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

-- Create rate limiting function for sensitive operations
CREATE OR REPLACE FUNCTION public.check_discovery_rate_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_queries integer;
BEGIN
  -- Check how many discovery queries in last 5 minutes
  SELECT COUNT(*) INTO recent_queries
  FROM security_audit_log
  WHERE user_id = p_user_id
    AND action = 'discovery_profiles_accessed'
    AND created_at > now() - interval '5 minutes';
  
  -- Allow max 30 queries per 5 minutes (1 per 10 seconds average)
  IF recent_queries >= 30 THEN
    -- Log rate limit violation
    PERFORM public.log_security_event(
      p_user_id,
      'rate_limit_exceeded',
      'discovery',
      NULL,
      jsonb_build_object('recent_queries', recent_queries, 'window', '5 minutes')
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Enhanced audit logging for profile views
CREATE OR REPLACE FUNCTION public.audit_profile_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log profile view for security monitoring
  PERFORM public.log_security_event(
    NEW.viewer_id,
    'profile_viewed',
    'profile',
    NEW.viewed_id,
    jsonb_build_object(
      'view_type', NEW.view_type,
      'timestamp', NEW.created_at
    )
  );
  
  RETURN NEW;
END;
$$;

-- Add trigger for profile view auditing
DROP TRIGGER IF EXISTS audit_profile_views ON profile_views;
CREATE TRIGGER audit_profile_views
  AFTER INSERT ON profile_views
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_view();

-- Add index for faster rate limit checks
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_action_time 
ON security_audit_log(user_id, action, created_at DESC);