
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Camera, X, Star } from 'lucide-react';

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
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = useCallback(async (file: File) => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  }, [user]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const photoUrl = await uploadPhoto(file);
      if (!photoUrl) {
        throw new Error('Failed to upload photo');
      }

      const nextOrderIndex = Math.max(...photos.map(p => p.order_index), -1) + 1;

      const { error } = await supabase
        .from('profile_photos')
        .insert({
          user_id: user.id,
          photo_url: photoUrl,
          is_primary: photos.length === 0, // First photo is primary
          order_index: nextOrderIndex
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      toast({
        title: "Photo uploaded!",
        description: "Your photo has been added to your profile.",
      });

      onPhotosUpdate();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
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
      console.error('Error deleting photo:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const setPrimaryPhoto = async (photoId: string) => {
    try {
      // Remove primary from all photos
      await supabase
        .from('profile_photos')
        .update({ is_primary: false })
        .eq('user_id', user?.id);

      // Set new primary
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
      console.error('Error setting primary photo:', error);
      toast({
        title: "Update failed",
        description: "Failed to update primary photo. Please try again.",
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
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white p-1 rounded-full">
                    <Star size={12} fill="white" />
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
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-0">
              <label className="aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                />
                <Camera size={24} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-500 text-center">
                  {uploading ? 'Uploading...' : 'Add Photo'}
                </span>
              </label>
            </CardContent>
          </Card>
        )}
      </div>
      
      <p className="text-xs text-gray-500">
        Add up to 6 photos. Your first photo will be your main profile picture.
      </p>
    </div>
  );
};

export default PhotoUploadSection;
