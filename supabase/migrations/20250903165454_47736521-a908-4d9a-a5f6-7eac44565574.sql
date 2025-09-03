-- Final fix for discovery profiles - handle edge cases with date_of_birth and simplify filtering

CREATE OR REPLACE FUNCTION get_discovery_profiles(
  user_uuid uuid,
  p_max_distance integer DEFAULT 50,
  p_age_min integer DEFAULT 18, 
  p_age_max integer DEFAULT 99,
  p_filter_education_levels text[] DEFAULT '{}',
  p_filter_interests text[] DEFAULT '{}',
  p_filter_relationship_goals text[] DEFAULT '{}',
  p_height_min integer DEFAULT 0,
  p_height_max integer DEFAULT 999,
  p_body_types text[] DEFAULT '{}',
  p_ethnicities text[] DEFAULT '{}',
  p_religion text DEFAULT '',
  p_smoking text DEFAULT '', 
  p_drinking text DEFAULT ''
) RETURNS TABLE(
  id uuid,
  first_name text,
  bio text,
  occupation text,
  education text,
  location_city text,
  location_state text,
  date_of_birth date,
  height_cm integer,
  interests text[],
  relationship_goals text[],
  distance_km numeric,
  compatibility_score integer,
  boost_active boolean,
  last_active timestamp with time zone
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Get user's profile for matching
  SELECT * INTO user_profile FROM profiles WHERE profiles.id = user_uuid;
  
  -- Return empty if user profile not found
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    COALESCE(p.bio, '') as bio,
    COALESCE(p.occupation, '') as occupation,
    COALESCE(p.education::text, '') as education,
    COALESCE(p.location_city, '') as location_city,
    COALESCE(p.location_state, '') as location_state,
    p.date_of_birth,
    p.height_cm,
    COALESCE(p.interests, ARRAY[]::text[]) as interests,
    COALESCE(array(SELECT unnest(p.relationship_goals))::text[], ARRAY[]::text[]) as relationship_goals,
    public.calculate_distance(
      user_profile.location_lat, user_profile.location_lng,
      p.location_lat, p.location_lng
    ) as distance_km,
    (
      -- Interest overlap (40% weight)
      COALESCE(array_length(array(SELECT unnest(COALESCE(p.interests, ARRAY[]::text[])) INTERSECT SELECT unnest(COALESCE(user_profile.interests, ARRAY[]::text[]))), 1), 0) * 8 +
      -- Relationship goals overlap (30% weight) 
      COALESCE(array_length(array(SELECT unnest(COALESCE(p.relationship_goals, ARRAY[]::relationship_goal[])) INTERSECT SELECT unnest(COALESCE(user_profile.relationship_goals, ARRAY[]::relationship_goal[]))), 1), 0) * 15 +
      -- Education compatibility (20% weight)
      CASE WHEN p.education = user_profile.education THEN 20 ELSE 0 END +
      -- Age compatibility (10% weight) - handle null dates
      CASE 
        WHEN p.date_of_birth IS NOT NULL AND user_profile.date_of_birth IS NOT NULL AND
             ABS(EXTRACT(YEAR FROM AGE(p.date_of_birth)) - EXTRACT(YEAR FROM AGE(user_profile.date_of_birth))) <= 5 THEN 10 
        ELSE 5 -- Default compatibility for missing dates
      END +
      -- Lifestyle compatibility bonus
      CASE WHEN p.smoking = user_profile.smoking THEN 5 ELSE 0 END +
      CASE WHEN p.drinking = user_profile.drinking THEN 5 ELSE 0 END
    ) as compatibility_score,
    EXISTS(SELECT 1 FROM boosts WHERE boosts.user_id = p.id AND boosts.is_active = true AND boosts.expires_at > now()) as boost_active,
    COALESCE(p.last_active, p.created_at) as last_active
  FROM profiles p
  WHERE p.id != user_uuid
    AND p.is_active = true
    -- Gender matching - user is interested in this profile's gender
    AND (
      user_profile.interested_in IS NULL OR 
      array_length(user_profile.interested_in, 1) = 0 OR 
      p.gender = ANY(user_profile.interested_in)
    )
    -- Reverse gender matching - profile is interested in user's gender
    AND (
      p.interested_in IS NULL OR 
      array_length(p.interested_in, 1) = 0 OR 
      user_profile.gender = ANY(p.interested_in) OR
      -- Special case for 'other' gender users - they can match with profiles interested in common genders
      (user_profile.gender = 'other')
    )
    -- Age filter - handle null dates gracefully
    AND (
      p.date_of_birth IS NULL OR
      EXTRACT(YEAR FROM AGE(p.date_of_birth)) BETWEEN p_age_min AND p_age_max
    )
    -- Height filter  
    AND (p.height_cm IS NULL OR (p.height_cm >= p_height_min AND p.height_cm <= p_height_max))
    -- Education filter
    AND (array_length(p_filter_education_levels, 1) = 0 OR p.education::text = ANY(p_filter_education_levels))
    -- Interest filter
    AND (array_length(p_filter_interests, 1) = 0 OR COALESCE(p.interests, ARRAY[]::text[]) && p_filter_interests)
    -- Relationship goals filter
    AND (array_length(p_filter_relationship_goals, 1) = 0 OR COALESCE(p.relationship_goals::text[], ARRAY[]::text[]) && p_filter_relationship_goals)
    -- Body type filter
    AND (array_length(p_body_types, 1) = 0 OR p.body_type = ANY(p_body_types))
    -- Ethnicity filter  
    AND (array_length(p_ethnicities, 1) = 0 OR p.ethnicity = ANY(p_ethnicities))
    -- Religion filter
    AND (p_religion = '' OR p.religion = p_religion)
    -- Smoking filter
    AND (p_smoking = '' OR p.smoking = p_smoking)
    -- Drinking filter
    AND (p_drinking = '' OR p.drinking = p_drinking)
    -- Distance filter - be more permissive for testing
    AND (
      p_max_distance <= 0 OR 
      user_profile.location_lat IS NULL OR 
      p.location_lat IS NULL OR
      public.calculate_distance(
        user_profile.location_lat, user_profile.location_lng,
        p.location_lat, p.location_lng
      ) <= p_max_distance OR
      p_max_distance >= 1000 -- Allow very wide searches
    )
    -- Exclude already swiped users
    AND NOT EXISTS (
      SELECT 1 FROM swipes s
      WHERE s.swiper_id = user_uuid AND s.swiped_id = p.id
    )
    -- Exclude blocked users
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks
      WHERE blocker_id = user_uuid AND blocked_id = p.id
    )
  ORDER BY 
    boost_active DESC,
    compatibility_score DESC,
    distance_km ASC NULLS LAST
  LIMIT 50; -- Add limit for performance
END;
$$;