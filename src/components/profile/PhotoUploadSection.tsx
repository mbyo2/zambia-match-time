import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Camera, X, Star, ImagePlus } from 'lucide-react';
import { useRateLimit } from '@/hooks/useRateLimit';
import { validateSecureFile, generateSecureFilename } from '@/utils/secureFileValidation';
import { useNativeCamera } from '@/hooks/useNativeCamera';
interface ProfilePhoto {
  id: string;
  photo_url: string;
  is_primary: boolean;
  order_index: number;
}

interface PhotoUploadSectionProps {
  photos: ProfilePhoto[];
  onPhotosUpdate: () => void;
}

const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({ photos, onPhotosUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkRateLimit } = useRateLimit();
  const { isNative, pickOrTakePhoto, isLoading: cameraLoading } = useNativeCamera();
  const [uploading, setUploading] = useState(false);
  const uploadPhoto = useCallback(async (file: File) => {
    if (!user) return null;

    const fileName = generateSecureFilename(file.name, user.id);

    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(data.path);

    return publicUrl;
  }, [user]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Rate limit check - 10 photo uploads per hour
    const rateCheck = await checkRateLimit('photo_upload', 10, 60);
    if (rateCheck.blocked) {
      toast({
        title: "Too many uploads",
        description: "Please wait before uploading more photos.",
        variant: "destructive",
      });
      return;
    }

    // Comprehensive file validation
    const validation = await validateSecureFile(file, 'image');
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error || "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const photoUrl = await uploadPhoto(file);
      if (!photoUrl) {
        throw new Error('Upload failed');
      }

      const nextOrderIndex = Math.max(...photos.map(p => p.order_index), -1) + 1;

      const { error } = await supabase
        .from('profile_photos')
        .insert({
          user_id: user.id,
          photo_url: photoUrl,
          is_primary: photos.length === 0,
          order_index: nextOrderIndex
        });

      if (error) throw error;

      toast({
        title: "Photo uploaded!",
        description: "Your photo has been added to your profile.",
      });

      onPhotosUpdate();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Unable to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleNativeCamera = async () => {
    if (!user) return;

    // Rate limit check
    const rateCheck = await checkRateLimit('photo_upload', 10, 60);
    if (rateCheck.blocked) {
      toast({
        title: "Too many uploads",
        description: "Please wait before uploading more photos.",
        variant: "destructive",
      });
      return;
    }

    const file = await pickOrTakePhoto();
    if (!file) return;

    // Validate the file
    const validation = await validateSecureFile(file, 'image');
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error || "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const photoUrl = await uploadPhoto(file);
      if (!photoUrl) {
        throw new Error('Upload failed');
      }

      const nextOrderIndex = Math.max(...photos.map(p => p.order_index), -1) + 1;

      const { error } = await supabase
        .from('profile_photos')
        .insert({
          user_id: user.id,
          photo_url: photoUrl,
          is_primary: photos.length === 0,
          order_index: nextOrderIndex
        });

      if (error) throw error;

      toast({
        title: "Photo uploaded!",
        description: "Your photo has been added to your profile.",
      });

      onPhotosUpdate();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Unable to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('profile_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Photo deleted",
        description: "Photo has been removed from your profile.",
      });

      onPhotosUpdate();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Unable to delete photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const setPrimaryPhoto = async (photoId: string) => {
    try {
      await supabase
        .from('profile_photos')
        .update({ is_primary: false })
        .eq('user_id', user?.id);

      const { error } = await supabase
        .from('profile_photos')
        .update({ is_primary: true })
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Primary photo updated",
        description: "This photo is now your main profile photo.",
      });

      onPhotosUpdate();
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Unable to update primary photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Profile Photos</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="relative overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square relative">
                <img
                  src={photo.photo_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
                {photo.is_primary && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground p-1 rounded-full">
                    <Star size={12} fill="currentColor" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {!photo.is_primary && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0"
                      onClick={() => setPrimaryPhoto(photo.id)}
                    >
                      <Star size={12} />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 w-6 p-0"
                    onClick={() => deletePhoto(photo.id)}
                  >
                    <X size={12} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {photos.length < 6 && (
          <Card className="border-dashed border-2 border-muted-foreground/30">
            <CardContent className="p-0">
              {isNative ? (
                // Native mobile: Use Capacitor Camera
                <button
                  onClick={handleNativeCamera}
                  disabled={uploading || cameraLoading}
                  className="aspect-square w-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  <Camera size={24} className="text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground text-center">
                    {uploading || cameraLoading ? 'Uploading...' : 'Add Photo'}
                  </span>
                </button>
              ) : (
                // Web: Use file input
                <label className="aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                  />
                  <ImagePlus size={24} className="text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground text-center">
                    {uploading ? 'Uploading...' : 'Add Photo'}
                  </span>
                </label>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Add up to 6 photos. Your first photo will be your main profile picture.
      </p>
    </div>
  );
};

export default PhotoUploadSection;
