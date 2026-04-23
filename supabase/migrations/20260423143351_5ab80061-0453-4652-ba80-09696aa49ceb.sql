-- Add reply support to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_seconds integer;

CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

-- Voice notes storage bucket (private — only conversation members can read via signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users upload into a folder named after their user id
DROP POLICY IF EXISTS "Voice notes are publicly readable" ON storage.objects;
CREATE POLICY "Voice notes are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-notes');

DROP POLICY IF EXISTS "Users can upload their own voice notes" ON storage.objects;
CREATE POLICY "Users can upload their own voice notes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-notes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own voice notes" ON storage.objects;
CREATE POLICY "Users can delete their own voice notes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-notes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);