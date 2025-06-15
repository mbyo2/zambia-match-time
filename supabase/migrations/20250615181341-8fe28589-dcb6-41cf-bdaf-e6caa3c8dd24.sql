
CREATE OR REPLACE FUNCTION public.get_compatible_profiles(user_uuid uuid, p_max_distance integer DEFAULT 50, p_age_min integer DEFAULT 18, p_age_max integer DEFAULT 99, p_filter_education_levels text[] DEFAULT '{}'::text[], p_filter_interests text[] DEFAULT '{}'::text[], p_filter_relationship_goals text[] DEFAULT '{}'::text[], p_height_min integer DEFAULT 0, p_height_max integer DEFAULT 999)
 RETURNS TABLE(id uuid, first_name text, bio text, occupation text, education text, location_city text, location_state text, date_of_birth date, height_cm integer, interests text[], relationship_goals text[], distance_km numeric, compatibility_score integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_profile RECORD;
BEGIN
  -- Get current user's profile for matching
  SELECT 
    p.location_lat, 
    p.location_lng, 
    p.interests as user_interests, 
    p.relationship_goals as user_goals,
    p.gender as user_gender,
    p.interested_in as user_interested_in
  INTO user_profile
  FROM public.profiles p
  WHERE p.id = user_uuid;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.bio,
    p.occupation,
    p.education::TEXT,
    p.location_city,
    p.location_state,
    p.date_of_birth,
    p.height_cm,
    p.interests,
    p.relationship_goals,
    public.calculate_distance(
      user_profile.location_lat, user_profile.location_lng,
      p.location_lat, p.location_lng
    ) as distance_km,
    -- Simple compatibility scoring
    (
      COALESCE(array_length(array(SELECT unnest(p.interests) INTERSECT SELECT unnest(user_profile.user_interests)), 1), 0) * 20 +
      COALESCE(array_length(array(SELECT unnest(p.relationship_goals) INTERSECT SELECT unnest(user_profile.user_goals)), 1), 0) * 30
    ) as compatibility_score
  FROM public.profiles p
  WHERE p.id != user_uuid
    AND p.is_active = true
    -- Gender preference matching
    AND (user_profile.user_interested_in IS NULL OR array_length(user_profile.user_interested_in, 1) = 0 OR p.gender = ANY(user_profile.user_interested_in))
    AND (p.interested_in IS NULL OR array_length(p.interested_in, 1) = 0 OR user_profile.user_gender = ANY(p.interested_in))
    -- Filter by age
    AND EXTRACT(YEAR FROM AGE(p.date_of_birth)) BETWEEN p_age_min AND p_age_max
    -- Filter by height
    AND (p.height_cm IS NULL OR (p.height_cm >= p_height_min AND p.height_cm <= p_height_max))
    -- Filter by education
    AND (p_filter_education_levels IS NULL OR array_length(p_filter_education_levels, 1) = 0 OR p.education::TEXT = ANY(p_filter_education_levels))
    -- Filter by interests
    AND (p_filter_interests IS NULL OR array_length(p_filter_interests, 1) = 0 OR p.interests && p_filter_interests)
    -- Filter by relationship goals
    AND (p_filter_relationship_goals IS NULL OR array_length(p_filter_relationship_goals, 1) = 0 OR p.relationship_goals::text[] && p_filter_relationship_goals)
    -- Filter by distance
    AND (
      p_max_distance <= 0 OR 
      user_profile.location_lat IS NULL OR 
      p.location_lat IS NULL OR
      public.calculate_distance(
        user_profile.location_lat, user_profile.location_lng,
        p.location_lat, p.location_lng
      ) <= p_max_distance
    )
    -- Exclude users the current user has already swiped on
    AND NOT EXISTS (
        SELECT 1 FROM public.swipes s
        WHERE s.swiper_id = user_uuid AND s.swiped_id = p.id
    )
  ORDER BY compatibility_score DESC, distance_km ASC NULLS LAST;
END;
$function$
