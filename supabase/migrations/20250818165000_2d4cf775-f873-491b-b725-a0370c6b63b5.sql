-- Security Fix 1 (continued): Complete database function hardening

CREATE OR REPLACE FUNCTION public.cleanup_fake_users()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete fake users and cascade will handle related data
  DELETE FROM profiles WHERE email LIKE '%@matchtime.com';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
DECLARE
  match_id UUID;
  user1_profile RECORD;
  user2_profile RECORD;
BEGIN
  -- Check if there's a mutual like
  IF NEW.action = 'like' AND EXISTS (
    SELECT 1 FROM public.swipes 
    WHERE swiper_id = NEW.swiped_id 
    AND swiped_id = NEW.swiper_id 
    AND action = 'like'
  ) THEN
    -- Create a match (ensure user1_id < user2_id for consistency)
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.swiper_id, NEW.swiped_id),
      GREATEST(NEW.swiper_id, NEW.swiped_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING
    RETURNING id INTO match_id;
    
    -- Create a conversation for the match
    INSERT INTO public.conversations (match_id)
    VALUES (match_id)
    ON CONFLICT DO NOTHING;
    
    -- Get profile names for notifications
    SELECT first_name INTO user1_profile FROM public.profiles WHERE id = NEW.swiper_id;
    SELECT first_name INTO user2_profile FROM public.profiles WHERE id = NEW.swiped_id;
    
    -- Create notifications for both users
    PERFORM public.create_notification(
      NEW.swiper_id,
      'match',
      'New Match!',
      'You have a new match with ' || COALESCE(user2_profile.first_name, 'someone'),
      NEW.swiped_id,
      match_id
    );
    
    PERFORM public.create_notification(
      NEW.swiped_id,
      'match',
      'New Match!',
      'You have a new match with ' || COALESCE(user1_profile.first_name, 'someone'),
      NEW.swiper_id,
      match_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_compatible_profiles(user_uuid uuid, p_max_distance integer DEFAULT 50, p_age_min integer DEFAULT 18, p_age_max integer DEFAULT 99, p_filter_education_levels text[] DEFAULT '{}'::text[], p_filter_interests text[] DEFAULT '{}'::text[], p_filter_relationship_goals text[] DEFAULT '{}'::text[], p_height_min integer DEFAULT 0, p_height_max integer DEFAULT 999)
 RETURNS TABLE(id uuid, first_name text, bio text, occupation text, education text, location_city text, location_state text, date_of_birth date, height_cm integer, interests text[], relationship_goals text[], distance_km numeric, compatibility_score integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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
$function$;

CREATE OR REPLACE FUNCTION public.get_enhanced_compatible_profiles(user_uuid uuid, p_max_distance integer DEFAULT 50, p_age_min integer DEFAULT 18, p_age_max integer DEFAULT 99, p_filter_education_levels text[] DEFAULT '{}'::text[], p_filter_interests text[] DEFAULT '{}'::text[], p_filter_relationship_goals text[] DEFAULT '{}'::text[], p_height_min integer DEFAULT 0, p_height_max integer DEFAULT 999, p_body_types text[] DEFAULT '{}'::text[], p_ethnicities text[] DEFAULT '{}'::text[], p_religion text DEFAULT ''::text, p_smoking text DEFAULT ''::text, p_drinking text DEFAULT ''::text)
 RETURNS TABLE(id uuid, first_name text, bio text, occupation text, education text, location_city text, location_state text, date_of_birth date, height_cm integer, interests text[], relationship_goals text[], distance_km numeric, compatibility_score integer, boost_active boolean, last_active timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_profile RECORD;
BEGIN
  -- Get current user's profile
  SELECT * INTO user_profile FROM profiles WHERE profiles.id = user_uuid;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.bio,
    p.occupation,
    p.education::text,
    p.location_city,
    p.location_state,
    p.date_of_birth,
    p.height_cm,
    p.interests,
    array(SELECT unnest(p.relationship_goals))::text[] as relationship_goals,
    public.calculate_distance(
      user_profile.location_lat, user_profile.location_lng,
      p.location_lat, p.location_lng
    ) as distance_km,
    -- Enhanced compatibility scoring
    (
      -- Interest overlap (40% weight)
      COALESCE(array_length(array(SELECT unnest(p.interests) INTERSECT SELECT unnest(user_profile.interests)), 1), 0) * 8 +
      -- Relationship goals overlap (30% weight)
      COALESCE(array_length(array(SELECT unnest(p.relationship_goals) INTERSECT SELECT unnest(user_profile.relationship_goals)), 1), 0) * 15 +
      -- Education level compatibility (20% weight)
      CASE WHEN p.education = user_profile.education THEN 20 ELSE 0 END +
      -- Age compatibility (10% weight)
      CASE WHEN ABS(EXTRACT(YEAR FROM AGE(p.date_of_birth)) - EXTRACT(YEAR FROM AGE(user_profile.date_of_birth))) <= 5 THEN 10 ELSE 0 END +
      -- Lifestyle compatibility bonus
      CASE WHEN p.smoking = user_profile.smoking THEN 5 ELSE 0 END +
      CASE WHEN p.drinking = user_profile.drinking THEN 5 ELSE 0 END
    ) as compatibility_score,
    -- Check if user has active boost
    EXISTS(SELECT 1 FROM boosts WHERE boosts.user_id = p.id AND boosts.is_active = true AND boosts.expires_at > now()) as boost_active,
    p.last_active
  FROM profiles p
  WHERE p.id != user_uuid
    AND p.is_active = true
    -- Gender preference matching
    AND (user_profile.interested_in IS NULL OR array_length(user_profile.interested_in, 1) = 0 OR p.gender = ANY(user_profile.interested_in))
    AND (p.interested_in IS NULL OR array_length(p.interested_in, 1) = 0 OR user_profile.gender = ANY(p.interested_in))
    -- Age filter
    AND EXTRACT(YEAR FROM AGE(p.date_of_birth)) BETWEEN p_age_min AND p_age_max
    -- Height filter
    AND (p.height_cm IS NULL OR (p.height_cm >= p_height_min AND p.height_cm <= p_height_max))
    -- Education filter
    AND (array_length(p_filter_education_levels, 1) = 0 OR p.education::text = ANY(p_filter_education_levels))
    -- Interest filter
    AND (array_length(p_filter_interests, 1) = 0 OR p.interests && p_filter_interests)
    -- Relationship goals filter
    AND (array_length(p_filter_relationship_goals, 1) = 0 OR p.relationship_goals::text[] && p_filter_relationship_goals)
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
    -- Exclude already swiped users
    AND NOT EXISTS (
      SELECT 1 FROM swipes s
      WHERE s.swiper_id = user_uuid AND s.swiped_id = p.id
    )
  ORDER BY 
    boost_active DESC, -- Boosted profiles first
    compatibility_score DESC, 
    distance_km ASC NULLS LAST;
END;
$function$;