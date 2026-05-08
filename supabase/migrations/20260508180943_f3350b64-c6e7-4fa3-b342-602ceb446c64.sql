
-- 1. Audit log: restrict insert to authenticated only
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;
CREATE POLICY "Authenticated can insert audit logs"
  ON public.security_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 2. user_subscriptions: remove user-facing UPDATE
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;

-- 3. user_stats: remove user-facing UPDATE
DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;

-- 4. user_achievements: remove user-facing INSERT
DROP POLICY IF EXISTS "Users can earn achievements" ON public.user_achievements;

-- 5. profiles.email: revoke column SELECT from client roles (owner can use auth.users email)
REVOKE SELECT (email) ON public.profiles FROM anon, authenticated;

-- 6. users_are_matched: only active matches
CREATE OR REPLACE FUNCTION public.users_are_matched(user1_id uuid, user2_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE is_active = true
      AND ((matches.user1_id = $1 AND matches.user2_id = $2)
        OR (matches.user1_id = $2 AND matches.user2_id = $1))
  );
$function$;
