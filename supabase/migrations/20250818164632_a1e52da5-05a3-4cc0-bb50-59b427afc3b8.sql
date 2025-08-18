-- Security Fix 1: Harden database functions with SET search_path = 'public'
-- This prevents schema poisoning attacks

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE p.id = user_id
      AND p.email = 'admin@justgrown.com'
      AND ur.role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = 'public'
AS $function$
BEGIN
  -- Return NULL if any coordinate is missing
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Haversine formula for distance calculation
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lon2) - radians(lon1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_app_statistics()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'real_users', (SELECT COUNT(*) FROM profiles WHERE email NOT LIKE '%@matchtime.com'),
    'fake_users', (SELECT COUNT(*) FROM profiles WHERE email LIKE '%@matchtime.com'),
    'total_matches', (SELECT COUNT(*) FROM matches),
    'total_messages', (SELECT COUNT(*) FROM messages),
    'active_users_7d', (SELECT COUNT(*) FROM profiles WHERE last_active > now() - interval '7 days'),
    'users_with_photos', (SELECT COUNT(DISTINCT user_id) FROM profile_photos),
    'total_swipes', (SELECT COUNT(*) FROM swipes)
  ) INTO stats;
  
  RETURN stats;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_user_stats_on_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_notification(target_user_id uuid, notification_type text, notification_title text, notification_message text, related_user_id uuid DEFAULT NULL::uuid, related_match_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, 
    type, 
    title, 
    message, 
    related_user_id, 
    related_match_id
  )
  VALUES (
    target_user_id, 
    notification_type, 
    notification_title, 
    notification_message, 
    related_user_id, 
    related_match_id
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.make_user_admin(user_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  -- Authorization: only super admins can grant admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get the user ID from the email
  SELECT id INTO target_user_id FROM public.profiles WHERE email = user_email;
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, date_of_birth, gender)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'first_name', 'New'),
    COALESCE(new.raw_user_meta_data ->> 'last_name', 'User'),
    COALESCE((new.raw_user_meta_data ->> 'date_of_birth')::date, '2000-01-01'),
    COALESCE((new.raw_user_meta_data ->> 'gender')::gender_type, 'other')
  );
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, tier)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_swipe_count(user_uuid uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  INSERT INTO public.daily_limits (user_id, date, swipes_used)
  VALUES (user_uuid, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    swipes_used = daily_limits.swipes_used + 1,
    updated_at = NOW();
$function$;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(notification_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.notifications 
  SET is_read = true, updated_at = now()
  WHERE id = ANY(notification_ids) 
    AND user_id = auth.uid();
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_last_active_on_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE profiles 
  SET last_active = now()
  WHERE id = NEW.sender_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Initialize stats if they don't exist
  INSERT INTO user_stats (user_id) 
  VALUES (NEW.id) 
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(user_uuid uuid)
 RETURNS subscription_tier
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT COALESCE(
    (SELECT tier FROM public.user_subscriptions 
     WHERE user_id = user_uuid 
     AND status = 'active' 
     AND (current_period_end IS NULL OR current_period_end > NOW())
     ORDER BY created_at DESC 
     LIMIT 1),
    'free'::subscription_tier
  );
$function$;

CREATE OR REPLACE FUNCTION public.update_last_active_on_swipe()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE profiles 
  SET last_active = now()
  WHERE id = NEW.swiper_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_last_active()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.profiles 
  SET last_active = NOW()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = p_user_id AND role = p_role
    );
$function$;

CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_stat RECORD;
  achievement RECORD;
BEGIN
  -- Get user stats
  SELECT * INTO user_stat FROM user_stats WHERE user_id = p_user_id;
  
  -- Check each achievement
  FOR achievement IN SELECT * FROM achievements LOOP
    -- Skip if already earned
    IF EXISTS (SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_id = achievement.id) THEN
      CONTINUE;
    END IF;
    
    -- Check if requirements are met
    CASE achievement.requirement_type
      WHEN 'matches' THEN
        IF user_stat.total_matches >= achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          UPDATE user_stats SET experience_points = experience_points + achievement.points_reward WHERE user_id = p_user_id;
        END IF;
      WHEN 'conversations' THEN
        IF user_stat.total_conversations >= achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          UPDATE user_stats SET experience_points = experience_points + achievement.points_reward WHERE user_id = p_user_id;
        END IF;
      WHEN 'login_streak' THEN
        IF user_stat.login_streak >= achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          UPDATE user_stats SET experience_points = experience_points + achievement.points_reward WHERE user_id = p_user_id;
        END IF;
      WHEN 'profile_views' THEN
        IF user_stat.profile_views >= achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          UPDATE user_stats SET experience_points = experience_points + achievement.points_reward WHERE user_id = p_user_id;
        END IF;
      WHEN 'super_likes_received' THEN
        IF user_stat.super_likes_received >= achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          UPDATE user_stats SET experience_points = experience_points + achievement.points_reward WHERE user_id = p_user_id;
        END IF;
    END CASE;
  END LOOP;
  
  -- Update level based on experience points
  UPDATE user_stats 
  SET level = GREATEST(1, experience_points / 1000 + 1)
  WHERE user_id = p_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_daily_swipe_limit(user_uuid uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT CASE 
    WHEN public.get_user_subscription_tier(user_uuid) = 'free' THEN 
      GREATEST(0, 50 - COALESCE((SELECT swipes_used FROM public.daily_limits 
                                WHERE user_id = user_uuid AND date = CURRENT_DATE), 0))
    ELSE 999999 -- Unlimited for premium users
  END;
$function$;