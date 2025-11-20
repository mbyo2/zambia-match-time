
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = (enableHighAccuracy = true) => {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false
  });
  const { toast } = useToast();

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by this browser';
      setLocation(prev => ({
        ...prev,
        error: errorMsg,
        loading: false
      }));
      toast({
        title: "Location Not Supported",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false
        });
      },
      (error) => {
        let errorMessage = 'Unknown error occurred';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Please enable location access in your browser settings';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your device settings';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again';
            break;
        }

        setLocation(prev => ({
          ...prev,
          error: errorMessage,
          loading: false
        }));

        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const watchPosition = () => {
    if (!navigator.geolocation) return null;

    return navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  return {
    ...location,
    getCurrentPosition,
    watchPosition,
    hasLocation: location.latitude !== null && location.longitude !== null
  };
};
