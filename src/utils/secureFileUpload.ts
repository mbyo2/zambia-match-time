import { supabase } from '@/integrations/supabase/client';

export interface SecureUploadResult {
  url?: string;
  error?: string;
}

export const uploadVerificationDocument = async (
  file: File,
  userId: string,
  documentType: 'selfie' | 'professional'
): Promise<SecureUploadResult> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('verification-docs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { error: error.message };
    }

    // Get the full URL - for private buckets we need to use getPublicUrl differently
    const { data: { publicUrl } } = supabase.storage
      .from('verification-docs')
      .getPublicUrl(data.path);

    return { url: publicUrl };
  } catch (error) {
    console.error('Secure upload error:', error);
    return { error: 'Failed to upload document securely' };
  }
};

export const getSecureVerificationDocumentUrl = async (
  path: string,
  expiresIn: number = 3600 // 1 hour
): Promise<SecureUploadResult> => {
  try {
    const { data, error } = await supabase.storage
      .from('verification-docs')
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error) {
    console.error('Secure URL generation error:', error);
    return { error: 'Failed to generate secure access URL' };
  }
};

export const uploadChatMedia = async (
  file: File,
  userId: string,
  conversationId: string
): Promise<SecureUploadResult> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${conversationId}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('chat-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Chat media upload error:', error);
      return { error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-media')
      .getPublicUrl(data.path);

    return { url: publicUrl };
  } catch (error) {
    console.error('Chat media upload error:', error);
    return { error: 'Failed to upload chat media' };
  }
};