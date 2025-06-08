
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  bucket: string;
  folder?: string;
  maxSizeKB?: number;
  allowedTypes?: string[];
}

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (
    file: File,
    options: UploadOptions
  ): Promise<string | null> => {
    const {
      bucket,
      folder = '',
      maxSizeKB = 5000, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    } = options;

    // Validate file size
    if (file.size > maxSizeKB * 1024) {
      toast({
        title: "File too large",
        description: `File must be less than ${maxSizeKB / 1024}MB`,
        variant: "destructive",
      });
      return null;
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: `Only ${allowedTypes.join(', ')} files are allowed`,
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setUploadProgress(100);
      
      toast({
        title: "Upload successful",
        description: "File uploaded successfully!",
      });

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const deleteFile = async (bucket: string, filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: "Delete failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "File deleted",
        description: "File deleted successfully!",
      });
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    isUploading,
    uploadProgress
  };
};
