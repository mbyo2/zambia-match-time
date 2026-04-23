-- Make voice-notes bucket private
UPDATE storage.buckets SET public = false WHERE id = 'voice-notes';

-- Replace permissive read policy with conversation-member check
DROP POLICY IF EXISTS "Voice notes are publicly readable" ON storage.objects;

CREATE POLICY "Conversation members can read voice notes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-notes'
  AND (
    -- owner can always read their own files
    auth.uid()::text = (storage.foldername(name))[1]
    -- or the file is referenced by a message in a conversation the user belongs to
    OR EXISTS (
      SELECT 1
      FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      JOIN public.matches mt ON mt.id = c.match_id
      WHERE m.media_url LIKE '%' || storage.objects.name
        AND (mt.user1_id = auth.uid() OR mt.user2_id = auth.uid())
    )
  )
);