import { supabase } from '@/integrations/supabase/client';

export interface SecureUploadResult {
  url?: string;
  error?: string;
}

/**
 * Validates file before upload for security
 */
const validateFile = (file: File, allowedTypes: string[], maxSize: number) => {
  // File size validation
  if (file.size > maxSize) {
    throw new Error(`File size too large. Maximum ${Math.round(maxSize / 1024 / 1024)}MB allowed.`);
  }

  // MIME type validation
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // File extension validation
  const fileExtension = file.name.toLowerCase().split('.').pop();
  const allowedExtensions = allowedTypes.map(type => type.split('/')[1]);
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    throw new Error('File extension does not match MIME type.');
  }

  // Additional security checks
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    throw new Error('Invalid file name.');
  }
};

export const uploadVerificationDocument = async (
  file: File,
  userId: string,
  documentType: 'selfie' | 'professional'
): Promise<SecureUploadResult> => {
  try {
    // Enhanced file validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    validateFile(file, allowedTypes, maxSize);

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
    // Enhanced file validation for chat media
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    validateFile(file, allowedTypes, maxSize);

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