
-- Drop the overly restrictive photo SELECT policy that depends on profiles RLS
DROP POLICY IF EXISTS "Users can view photos of active non-blocked profiles" ON public.profile_photos;

-- Create a new policy that checks active/blocked status directly without depending on profiles table RLS
CREATE POLICY "Users can view photos of active non-blocked profiles"
ON public.profile_photos
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_photos.user_id
        AND p.is_active = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks
      WHERE blocker_id = auth.uid() AND blocked_id = profile_photos.user_id
    )
  )
);
