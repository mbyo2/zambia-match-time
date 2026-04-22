
-- Server-side tier enforcement RPCs

-- 1) consume_swipe: enforces daily swipe limits per tier
CREATE OR REPLACE FUNCTION public.consume_swipe()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  user_tier subscription_tier;
  used int;
  max_swipes int;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  END IF;

  user_tier := public.get_user_subscription_tier(uid);

  -- Free: 50/day; paid tiers: unlimited
  IF user_tier = 'free' THEN
    max_swipes := 50;
  ELSE
    max_swipes := -1;
  END IF;

  SELECT COALESCE(swipes_used, 0) INTO used
  FROM public.daily_limits
  WHERE user_id = uid AND date = CURRENT_DATE;

  IF max_swipes <> -1 AND COALESCE(used, 0) >= max_swipes THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit_reached',
      'remaining', 0,
      'tier', user_tier
    );
  END IF;

  INSERT INTO public.daily_limits (user_id, date, swipes_used)
  VALUES (uid, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    swipes_used = public.daily_limits.swipes_used + 1,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', CASE WHEN max_swipes = -1 THEN -1 ELSE max_swipes - (COALESCE(used,0) + 1) END,
    'tier', user_tier
  );
END;
$$;

-- 2) consume_super_like: paid tiers only, with per-tier daily quotas
CREATE OR REPLACE FUNCTION public.consume_super_like()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  user_tier subscription_tier;
  used int;
  max_sl int;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  END IF;

  user_tier := public.get_user_subscription_tier(uid);

  IF user_tier = 'free' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'tier_required', 'required_tier', 'basic');
  END IF;

  max_sl := CASE user_tier
    WHEN 'basic' THEN 5
    WHEN 'premium' THEN 10
    WHEN 'elite' THEN -1
    ELSE 0
  END;

  SELECT COALESCE(super_likes_used, 0) INTO used
  FROM public.daily_limits
  WHERE user_id = uid AND date = CURRENT_DATE;

  IF max_sl <> -1 AND COALESCE(used, 0) >= max_sl THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'daily_limit_reached', 'remaining', 0, 'tier', user_tier);
  END IF;

  INSERT INTO public.daily_limits (user_id, date, super_likes_used)
  VALUES (uid, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    super_likes_used = public.daily_limits.super_likes_used + 1,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', CASE WHEN max_sl = -1 THEN -1 ELSE max_sl - (COALESCE(used,0) + 1) END,
    'tier', user_tier
  );
END;
$$;

-- 3) consume_boost: Premium/Elite only, with monthly quota; activates a boost record
CREATE OR REPLACE FUNCTION public.consume_boost(p_duration_minutes int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  user_tier subscription_tier;
  used_this_month int;
  max_boosts int;
  new_boost_id uuid;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  END IF;

  user_tier := public.get_user_subscription_tier(uid);

  IF user_tier IN ('free', 'basic') THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'tier_required', 'required_tier', 'premium');
  END IF;

  max_boosts := CASE user_tier
    WHEN 'premium' THEN 5
    WHEN 'elite' THEN -1
    ELSE 0
  END;

  SELECT COUNT(*) INTO used_this_month
  FROM public.boosts
  WHERE user_id = uid
    AND started_at >= date_trunc('month', now());

  IF max_boosts <> -1 AND used_this_month >= max_boosts THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'monthly_limit_reached', 'remaining', 0, 'tier', user_tier);
  END IF;

  INSERT INTO public.boosts (user_id, boost_type, started_at, expires_at, is_active)
  VALUES (uid, 'profile', now(), now() + (p_duration_minutes || ' minutes')::interval, true)
  RETURNING id INTO new_boost_id;

  -- Mirror in daily_limits for analytics
  INSERT INTO public.daily_limits (user_id, date, boosts_used)
  VALUES (uid, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    boosts_used = public.daily_limits.boosts_used + 1,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'allowed', true,
    'boost_id', new_boost_id,
    'expires_at', now() + (p_duration_minutes || ' minutes')::interval,
    'remaining', CASE WHEN max_boosts = -1 THEN -1 ELSE max_boosts - (used_this_month + 1) END,
    'tier', user_tier
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_swipe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_super_like() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_boost(int) TO authenticated;
