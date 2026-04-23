import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads a recorded voice note to the private `voice-notes` bucket.
 * Path is `<userId>/<conversationId>/<timestamp>.<ext>` so RLS based on
 * `(storage.foldername(name))[1] = auth.uid()::text` works.
 */
export async function uploadVoiceNote(
  blob: Blob,
  userId: string,
  conversationId: string,
  mimeType: string,
): Promise<{ path: string; signedUrl: string }> {
  const ext =
    mimeType.includes('mp4') ? 'm4a' :
    mimeType.includes('ogg') ? 'ogg' :
    'webm';

  const path = `${userId}/${conversationId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('voice-notes')
    .upload(path, blob, { contentType: mimeType, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  // Long-lived signed URL — bucket is private so we cannot use a public URL.
  const { data, error: signError } = await supabase.storage
    .from('voice-notes')
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signError || !data?.signedUrl) {
    throw new Error(signError?.message || 'Could not sign voice note URL');
  }

  return { path, signedUrl: data.signedUrl };
}