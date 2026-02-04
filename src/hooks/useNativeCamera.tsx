import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { useToast } from '@/hooks/use-toast';

interface CameraState {
  isSupported: boolean;
  isLoading: boolean;
  lastPhoto: Photo | null;
}

export const useNativeCamera = () => {
  const { toast } = useToast();
  const [state, setState] = useState<CameraState>({
    isSupported: Capacitor.isNativePlatform(),
    isLoading: false,
    lastPhoto: null
  });

  const isNative = Capacitor.isNativePlatform();

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
      const result = await Camera.checkPermissions();
      return result.camera === 'granted' && result.photos === 'granted';
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return false;
    }
  }, [isNative]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
      const result = await Camera.requestPermissions({
        permissions: ['camera', 'photos']
      });
      return result.camera === 'granted' && result.photos === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }, [isNative]);

  const takePhoto = useCallback(async (): Promise<File | null> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request permissions first
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) {
          toast({
            title: "Camera Permission Required",
            description: "Please enable camera access in your device settings",
            variant: "destructive",
          });
          setState(prev => ({ ...prev, isLoading: false }));
          return null;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 1080,
        height: 1080,
        correctOrientation: true,
      });

      setState(prev => ({ ...prev, lastPhoto: photo }));

      // Convert base64 to File
      if (photo.base64String) {
        const file = base64ToFile(
          photo.base64String, 
          `photo_${Date.now()}.${photo.format || 'jpeg'}`,
          `image/${photo.format || 'jpeg'}`
        );
        setState(prev => ({ ...prev, isLoading: false }));
        return file;
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    } catch (error: any) {
      console.error('Error taking photo:', error);
      
      // User cancelled - don't show error
      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        setState(prev => ({ ...prev, isLoading: false }));
        return null;
      }

      toast({
        title: "Camera Error",
        description: "Failed to take photo. Please try again.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [checkPermissions, requestPermissions, toast]);

  const pickFromGallery = useCallback(async (): Promise<File | null> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request permissions first
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) {
          toast({
            title: "Photo Library Permission Required",
            description: "Please enable photo library access in your device settings",
            variant: "destructive",
          });
          setState(prev => ({ ...prev, isLoading: false }));
          return null;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        width: 1080,
        height: 1080,
        correctOrientation: true,
      });

      setState(prev => ({ ...prev, lastPhoto: photo }));

      // Convert base64 to File
      if (photo.base64String) {
        const file = base64ToFile(
          photo.base64String,
          `photo_${Date.now()}.${photo.format || 'jpeg'}`,
          `image/${photo.format || 'jpeg'}`
        );
        setState(prev => ({ ...prev, isLoading: false }));
        return file;
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    } catch (error: any) {
      console.error('Error picking photo:', error);
      
      // User cancelled - don't show error
      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        setState(prev => ({ ...prev, isLoading: false }));
        return null;
      }

      toast({
        title: "Gallery Error",
        description: "Failed to pick photo. Please try again.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [checkPermissions, requestPermissions, toast]);

  const pickOrTakePhoto = useCallback(async (): Promise<File | null> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt, // Shows action sheet to choose
        width: 1080,
        height: 1080,
        correctOrientation: true,
        promptLabelHeader: 'Add Photo',
        promptLabelCancel: 'Cancel',
        promptLabelPhoto: 'Choose from Gallery',
        promptLabelPicture: 'Take Photo',
      });

      setState(prev => ({ ...prev, lastPhoto: photo }));

      // Convert base64 to File
      if (photo.base64String) {
        const file = base64ToFile(
          photo.base64String,
          `photo_${Date.now()}.${photo.format || 'jpeg'}`,
          `image/${photo.format || 'jpeg'}`
        );
        setState(prev => ({ ...prev, isLoading: false }));
        return file;
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    } catch (error: any) {
      console.error('Error with photo:', error);
      
      // User cancelled - don't show error
      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        setState(prev => ({ ...prev, isLoading: false }));
        return null;
      }

      toast({
        title: "Photo Error",
        description: "Failed to get photo. Please try again.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [toast]);

  return {
    ...state,
    isNative,
    takePhoto,
    pickFromGallery,
    pickOrTakePhoto,
    checkPermissions,
    requestPermissions,
  };
};

// Helper function to convert base64 to File
function base64ToFile(base64: string, filename: string, mimeType: string): File {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  
  return new File([blob], filename, { type: mimeType });
}
