
-- Unmatch function (either party may dissolve)
CREATE OR REPLACE FUNCTION public.unmatch(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  is_member boolean;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated'); END IF;

  SELECT EXISTS (
    SELECT 1 FROM matches
    WHERE id = p_match_id AND (user1_id = uid OR user2_id = uid)
  ) INTO is_member;

  IF NOT is_member THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_match_member');
  END IF;

  UPDATE matches SET is_active = false WHERE id = p_match_id;

  PERFORM log_security_event(uid, 'match_unmatched', 'match', p_match_id, '{}'::jsonb);
  RETURN jsonb_build_object('success', true);
END;
$$;

-- GDPR data export
CREATE OR REPLACE FUNCTION public.export_user_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  result jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT jsonb_build_object(
    'exported_at', now(),
    'user_id', uid,
    'profile', (SELECT to_jsonb(p) FROM profiles p WHERE id = uid),
    'photos', COALESCE((SELECT jsonb_agg(to_jsonb(pp)) FROM profile_photos pp WHERE user_id = uid), '[]'::jsonb),
    'matches', COALESCE((SELECT jsonb_agg(to_jsonb(m)) FROM matches m WHERE user1_id = uid OR user2_id = uid), '[]'::jsonb),
    'messages_sent', COALESCE((SELECT jsonb_agg(to_jsonb(msg)) FROM messages msg WHERE sender_id = uid), '[]'::jsonb),
    'swipes', COALESCE((SELECT jsonb_agg(to_jsonb(s)) FROM swipes s WHERE swiper_id = uid), '[]'::jsonb),
    'subscription', (SELECT to_jsonb(us) FROM user_subscriptions us WHERE user_id = uid LIMIT 1),
    'stats', (SELECT to_jsonb(st) FROM user_stats st WHERE user_id = uid LIMIT 1),
    'achievements', COALESCE((SELECT jsonb_agg(to_jsonb(ua)) FROM user_achievements ua WHERE user_id = uid), '[]'::jsonb),
    'reports_filed', COALESCE((SELECT jsonb_agg(to_jsonb(r)) FROM reports r WHERE reporter_id = uid), '[]'::jsonb),
    'blocks', COALESCE((SELECT jsonb_agg(to_jsonb(ub)) FROM user_blocks ub WHERE blocker_id = uid), '[]'::jsonb),
    'prompt_responses', COALESCE((SELECT jsonb_agg(to_jsonb(upr)) FROM user_prompt_responses upr WHERE user_id = uid), '[]'::jsonb),
    'notifications', COALESCE((SELECT jsonb_agg(to_jsonb(n)) FROM notifications n WHERE user_id = uid), '[]'::jsonb)
  ) INTO result;

  PERFORM log_security_event(uid, 'data_exported', 'user', uid, '{}'::jsonb);
  RETURN result;
END;
$$;

-- Story cleanup
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin_only';
  END IF;
  WITH d AS (
    DELETE FROM stories WHERE expires_at < now() RETURNING id
  )
  SELECT COUNT(*) INTO cleaned FROM d;
  RETURN cleaned;
END;
$$;

-- Onboarding events
CREATE TABLE IF NOT EXISTS public.onboarding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  step int NOT NULL,
  event text NOT NULL, -- 'started','completed','abandoned'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own onboarding events"
  ON public.onboarding_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users view own onboarding events"
  ON public.onboarding_events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Ban user (admin)
CREATE OR REPLACE FUNCTION public.ban_user(p_user_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin_only';
  END IF;
  UPDATE profiles SET is_active = false WHERE id = p_user_id;
  UPDATE matches SET is_active = false WHERE user1_id = p_user_id OR user2_id = p_user_id;
  PERFORM log_security_event(auth.uid(), 'user_banned', 'profile', p_user_id, jsonb_build_object('reason', p_reason));
  RETURN jsonb_build_object('success', true);
END;
$$;
