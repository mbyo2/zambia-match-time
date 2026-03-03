
-- Fix discovery to handle prefer_not_to_say/other genders inclusively
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
  SELECT 
    p.location_lat, p.location_lng, p.age_min, p.age_max, p.max_distance,
    p.interested_in::text[], p.gender::text
  INTO _user_lat, _user_lng, _min_age, _max_age, _max_distance, _user_interested_in, _user_gender
  FROM profiles p
  WHERE p.id = _user_id;

  PERFORM public.log_security_event(
    _user_id, 'discovery_profiles_accessed', 'profiles', NULL,
    jsonb_build_object('filters', _filters)
  );

  RETURN QUERY
  SELECT 
    p.id, p.first_name,
    EXTRACT(YEAR FROM age(p.date_of_birth))::integer as age,
    p.bio, p.occupation, p.education::text, p.height_cm, p.interests, p.looking_for,
    p.location_city, p.location_state,
    CASE 
      WHEN _user_lat IS NOT NULL AND _user_lng IS NOT NULL 
        AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
      THEN public.fuzz_distance(
        ROUND(6371 * acos(
          cos(radians(_user_lat)) * cos(radians(p.location_lat)) *
          cos(radians(p.location_lng) - radians(_user_lng)) +
          sin(radians(_user_lat)) * sin(radians(p.location_lat))
        ))
      )
      ELSE NULL
    END as distance_km,
    p.compatibility_score, p.is_verified, p.professional_badge, p.has_accommodation_available
  FROM profiles p
  WHERE p.id != _user_id
    AND p.is_active = true
    -- Gender matching: prefer_not_to_say and other match everyone
    AND (
      _user_gender IN ('prefer_not_to_say', 'other')
      OR p.interested_in::text[] @> ARRAY[_user_gender]
    )
    AND (
      p.gender::text IN ('prefer_not_to_say', 'other')
      OR p.gender::text = ANY(_user_interested_in)
    )
    AND EXTRACT(YEAR FROM age(p.date_of_birth)) BETWEEN _min_age AND _max_age
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks 
      WHERE (blocker_id = _user_id AND blocked_id = p.id)
         OR (blocker_id = p.id AND blocked_id = _user_id)
    )
    AND NOT EXISTS (
      SELECT 1 FROM swipes
      WHERE swiper_id = _user_id AND swiped_id = p.id
    )
    AND (
      _user_lat IS NULL OR _user_lng IS NULL OR
      p.location_lat IS NULL OR p.location_lng IS NULL OR
      (6371 * acos(
        cos(radians(_user_lat)) * cos(radians(p.location_lat)) *
        cos(radians(p.location_lng) - radians(_user_lng)) +
        sin(radians(_user_lat)) * sin(radians(p.location_lat))
      )) <= _max_distance
    )
  ORDER BY RANDOM()
  LIMIT 50;
END;
$$;

-- Add message read receipts: allow users to update messages in their conversations
CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
USING (
  conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN matches m ON c.match_id = m.id
    WHERE m.user1_id = auth.uid() OR m.user2_id = auth.uid()
  )
);

-- Add unmatch: allow users to deactivate their own matches
CREATE POLICY "Users can update their own matches"
ON public.matches
FOR UPDATE
USING (user1_id = auth.uid() OR user2_id = auth.uid());
