
-- Allow users to view profiles of people they are matched with
CREATE POLICY "Users can view matched users profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.matches
    WHERE is_active = true
    AND (
      (user1_id = auth.uid() AND user2_id = profiles.id)
      OR (user2_id = auth.uid() AND user1_id = profiles.id)
    )
  )
);

-- Allow users to delete their own recent swipes (for undo)
CREATE POLICY "Users can delete their own swipes"
ON public.swipes
FOR DELETE
TO authenticated
USING (swiper_id = auth.uid());

-- Allow conversations to be updated (last_message_at)
CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  match_id IN (
    SELECT id FROM public.matches
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);
