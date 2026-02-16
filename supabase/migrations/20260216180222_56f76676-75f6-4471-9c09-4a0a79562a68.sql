-- Allow users to see swipes where they are the swiped user (for "Who Liked You" feature)
CREATE POLICY "Users can view swipes on them"
ON public.swipes
FOR SELECT
USING (swiped_id = auth.uid());