
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  onPhotoUploaded?: (url: string) => void;
  maxPhotos?: number;
  existingPhotos?: string[];
}

const PhotoUpload = ({ onPhotoUploaded, maxPhotos = 6, existingPhotos = [] }: PhotoUploadProps) => {
  const { user } = useAuth();
  const { uploadFile, isUploading } = useFileUpload();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>(existingPhotos);

  const handleFileSelect = async (file: File) => {
    if (!user) return;

    if (photos.length >= maxPhotos) {
      toast({
        title: "Photo limit reached",
        description: `You can only upload up to ${maxPhotos} photos.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const photoUrl = await uploadFile(file, {
        bucket: 'profile-photos',
        folder: user.id,
        maxSizeKB: 5120, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      });

      if (!photoUrl) return;

      // Save to database
      const { error } = await supabase
        .from('profile_photos')
        .insert({
          user_id: user.id,
          photo_url: photoUrl,
          is_primary: photos.length === 0,
          order_index: photos.length
        });

      if (error) {
        console.error('Error saving photo:', error);
        toast({
          title: "Error",
          description: "Failed to save photo",
          variant: "destructive",
        });
        return;
      }

      const newPhotos = [...photos, photoUrl];
      setPhotos(newPhotos);
      onPhotoUploaded?.(photoUrl);

      toast({
        title: "Photo uploaded",
        description: "Your photo has been uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const removePhoto = async (photoUrl: string, index: number) => {
    try {
      // Remove from database
      const { error } = await supabase
        .from('profile_photos')
        .delete()
        .eq('user_id', user?.id)
        .eq('photo_url', photoUrl);

      if (error) {
        console.error('Error removing photo:', error);
        return;
      }

      const newPhotos = photos.filter((_, i) => i !== index);
      setPhotos(newPhotos);

      toast({
        title: "Photo removed",
        description: "Photo has been removed from your profile.",
      });
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative aspect-square">
            <img 
              src={photo} 
              alt={`Profile photo ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={() => removePhoto(photo, index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
            {index === 0 && (
              <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                Primary
              </div>
            )}
          </div>
        ))}
        
        {photos.length < maxPhotos && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <Camera className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">Add Photo</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || photos.length >= maxPhotos}
          className="flex items-center gap-2"
        >
          <Upload size={16} />
          {isUploading ? 'Uploading...' : 'Upload Photo'}
        </Button>
      </div>

      <p className="text-sm text-gray-600">
        {photos.length}/{maxPhotos} photos uploaded. First photo will be your primary photo.
      </p>
    </div>
  );
};

export default PhotoUpload;
