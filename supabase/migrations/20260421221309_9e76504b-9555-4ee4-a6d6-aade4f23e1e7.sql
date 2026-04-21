CREATE OR REPLACE FUNCTION public.cleanup_fake_users()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
  fake_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO fake_ids
  FROM profiles
  WHERE email LIKE '%@matchtime.com';

  IF fake_ids IS NULL OR array_length(fake_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- Delete dependent rows first
  DELETE FROM message_reactions WHERE user_id = ANY(fake_ids);
  DELETE FROM messages WHERE sender_id = ANY(fake_ids);
  DELETE FROM conversations WHERE match_id IN (
    SELECT id FROM matches WHERE user1_id = ANY(fake_ids) OR user2_id = ANY(fake_ids)
  );
  DELETE FROM matches WHERE user1_id = ANY(fake_ids) OR user2_id = ANY(fake_ids);
  DELETE FROM swipes WHERE swiper_id = ANY(fake_ids) OR swiped_id = ANY(fake_ids);
  DELETE FROM profile_photos WHERE user_id = ANY(fake_ids);
  DELETE FROM profile_videos WHERE user_id = ANY(fake_ids);
  DELETE FROM profile_views WHERE viewer_id = ANY(fake_ids) OR viewed_id = ANY(fake_ids);
  DELETE FROM user_stats WHERE user_id = ANY(fake_ids);
  DELETE FROM user_achievements WHERE user_id = ANY(fake_ids);
  DELETE FROM user_blocks WHERE blocker_id = ANY(fake_ids) OR blocked_id = ANY(fake_ids);
  DELETE FROM user_prompt_responses WHERE user_id = ANY(fake_ids);
  DELETE FROM user_subscriptions WHERE user_id = ANY(fake_ids);
  DELETE FROM user_roles WHERE user_id = ANY(fake_ids);
  DELETE FROM daily_limits WHERE user_id = ANY(fake_ids);
  DELETE FROM daily_rewards WHERE user_id = ANY(fake_ids);
  DELETE FROM boosts WHERE user_id = ANY(fake_ids);
  DELETE FROM notifications WHERE user_id = ANY(fake_ids) OR related_user_id = ANY(fake_ids);
  DELETE FROM push_subscriptions WHERE user_id = ANY(fake_ids);
  DELETE FROM rate_limits WHERE user_id = ANY(fake_ids);
  DELETE FROM reports WHERE reporter_id = ANY(fake_ids) OR reported_id = ANY(fake_ids);
  DELETE FROM saved_searches WHERE user_id = ANY(fake_ids);
  DELETE FROM stories WHERE user_id = ANY(fake_ids);
  DELETE FROM story_views WHERE viewer_id = ANY(fake_ids);
  DELETE FROM verification_requests WHERE user_id = ANY(fake_ids);
  DELETE FROM gift_transactions WHERE sender_id = ANY(fake_ids) OR receiver_id = ANY(fake_ids);

  -- Now safe to delete profiles
  DELETE FROM profiles WHERE id = ANY(fake_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Finally remove auth users
  DELETE FROM auth.users WHERE id = ANY(fake_ids);

  RETURN deleted_count;
END;
$$;

-- Run it now
SELECT public.cleanup_fake_users();