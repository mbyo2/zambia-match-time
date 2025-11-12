-- Security Fix Migration: High-Priority RLS Policy Updates
-- Fixes email exposure, accommodation privacy, user responses, and stories visibility

-- ============================================================================
-- 1. FIX: Profile Photos/Videos - Prevent email exposure through joins
-- ============================================================================

-- Drop existing permissive policies that could expose profile data
DROP POLICY IF EXISTS "Users can view photos of visible profiles" ON public.profile_photos;
DROP POLICY IF EXISTS "Users can view videos of visible profiles" ON public.profile_videos;

-- Create stricter policies that prevent profile data leakage
CREATE POLICY "Users can view photos of active non-blocked profiles"
ON public.profile_photos
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles
    WHERE is_active = true
      AND id != auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks
        WHERE blocker_id = auth.uid() AND blocked_id = profiles.id
      )
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Users can view videos of active non-blocked profiles"
ON public.profile_videos
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles
    WHERE is_active = true
      AND id != auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks
        WHERE blocker_id = auth.uid() AND blocked_id = profiles.id
      )
  )
  OR user_id = auth.uid()
);

-- ============================================================================
-- 2. FIX: Accommodations - Restrict to authenticated users only
-- ============================================================================

DROP POLICY IF EXISTS "Accommodations are public to view." ON public.accommodations;

CREATE POLICY "Authenticated users can view accommodations"
ON public.accommodations
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- 3. FIX: User Prompt Responses - Restrict to matched users only
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view public responses from non-blocked" ON public.user_prompt_responses;

-- Create helper function to check if users are matched
CREATE OR REPLACE FUNCTION public.users_are_matched(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE (user1_id = $1 AND user2_id = $2)
       OR (user1_id = $2 AND user2_id = $1)
  );
$$;

CREATE POLICY "Users can view responses from matched users only"
ON public.user_prompt_responses
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() -- Own responses
  OR (
    is_public = true 
    AND public.users_are_matched(auth.uid(), user_id) -- Matched users only
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks
      WHERE blocker_id = auth.uid() AND blocked_id = user_prompt_responses.user_id
    )
  )
);

-- ============================================================================
-- 4. FIX: Stories - Restrict to matched users or discovery profiles
-- ============================================================================

DROP POLICY IF EXISTS "Users can view unexpired stories" ON public.stories;

CREATE POLICY "Users can view stories from matched users or discovery profiles"
ON public.stories
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() -- Own stories
  OR (
    expires_at > now()
    AND (
      -- Stories from matched users
      public.users_are_matched(auth.uid(), user_id)
      -- OR stories from users in discovery feed (within max distance)
      OR user_id IN (
        SELECT p.id FROM public.profiles p
        CROSS JOIN public.profiles up
        WHERE up.id = auth.uid()
          AND p.is_active = true
          AND p.id != auth.uid()
          -- Within distance range (if both have locations)
          AND (
            up.location_lat IS NULL 
            OR p.location_lat IS NULL
            OR public.calculate_distance(
              up.location_lat, up.location_lng,
              p.location_lat, p.location_lng
            ) <= COALESCE(up.max_distance, 50)
          )
          -- Not blocked
          AND NOT EXISTS (
            SELECT 1 FROM public.user_blocks
            WHERE blocker_id = auth.uid() AND blocked_id = p.id
          )
      )
    )
  )
);

-- ============================================================================
-- 5. OPTIONAL: Restrict non-essential public data to authenticated users
-- ============================================================================

-- Virtual Gifts: Require authentication
DROP POLICY IF EXISTS "Everyone can view active gifts" ON public.virtual_gifts;

CREATE POLICY "Authenticated users can view active gifts"
ON public.virtual_gifts
FOR SELECT
TO authenticated
USING (is_active = true);

-- Icebreaker Prompts: Require authentication
DROP POLICY IF EXISTS "Everyone can view active prompts" ON public.icebreaker_prompts;

CREATE POLICY "Authenticated users can view active prompts"
ON public.icebreaker_prompts
FOR SELECT
TO authenticated
USING (is_active = true);

-- Achievements: Require authentication
DROP POLICY IF EXISTS "Everyone can view achievements" ON public.achievements;

CREATE POLICY "Authenticated users can view achievements"
ON public.achievements
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- 6. Log security event for this migration
-- ============================================================================

DO $$
BEGIN
  PERFORM public.log_security_event(
    NULL, -- System action, no user_id
    'rls_policies_hardened',
    'database_migration',
    NULL,
    jsonb_build_object(
      'tables_updated', ARRAY[
        'profile_photos', 
        'profile_videos', 
        'accommodations', 
        'user_prompt_responses', 
        'stories',
        'virtual_gifts',
        'icebreaker_prompts',
        'achievements'
      ],
      'security_level', 'high_priority_fixes',
      'timestamp', now()
    )
  );
END $$;