import { supabase } from '@/integrations/supabase/client';

export interface SecureImageUploadResult {
  url?: string;
  error?: string;
}

// Enhanced file validation with security checks
const validateImageFile = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
  // File size check (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }

  // MIME type validation - only allow specific image types
  const allowedMimeTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp'
  ];
  if (!allowedMimeTypes.includes(file.type)) {
    return { isValid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  // File extension validation (double-check against MIME type spoofing)
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    return { isValid: false, error: 'Invalid file extension' };
  }

  // File name validation - prevent path traversal
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
  if (sanitizedName !== file.name || file.name.includes('..') || file.name.includes('/')) {
    return { isValid: false, error: 'Invalid file name' };
  }

  // Basic file header validation (magic bytes)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer, 0, 4);
      
      // Check for common image file signatures
      const jpg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
      const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
      const webp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
      
      if (jpg || png || webp) {
        resolve({ isValid: true });
      } else {
        resolve({ isValid: false, error: 'File appears to be corrupted or not a valid image' });
      }
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
};

/**
 * Securely upload profile photos with enhanced validation
 */
export const uploadProfilePhoto = async (
  file: File, 
  userId: string, 
  photoIndex: number = 0
): Promise<SecureImageUploadResult> => {
  try {
    // Enhanced file validation
    const validation = await validateImageFile(file);
    if (!validation.isValid) {
      return { error: validation.error };
    }

    // Generate secure filename with timestamp and random component
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    const fileName = `${userId}_${photoIndex}_${timestamp}_${randomId}${fileExtension}`;
    const filePath = `profile-photos/${fileName}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Prevent overwriting existing files
        contentType: file.type
      });

    if (error) {
      console.error('Upload error:', error);
      return { error: 'Failed to upload image. Please try again.' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl };
  } catch (error) {
    console.error('Image upload error:', error);
    return { error: 'An unexpected error occurred during upload' };
  }
};

/**
 * Securely delete profile photo
 */
export const deleteProfilePhoto = async (photoUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = photoUrl.split('/profile-photos/');
    if (urlParts.length !== 2) {
      console.error('Invalid photo URL format');
      return false;
    }

    const filePath = urlParts[1];
    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([`profile-photos/${filePath}`]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Photo deletion error:', error);
    return false;
  }
};