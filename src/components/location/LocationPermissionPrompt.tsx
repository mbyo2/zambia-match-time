import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Heart, Shield } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LocationPermissionPromptProps {
  onLocationSet: () => void;
  onSkip: () => void;
}

const LocationPermissionPrompt: React.FC<LocationPermissionPromptProps> = ({
  onLocationSet,
  onSkip
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getCurrentPosition, loading, latitude, longitude, error } = useGeolocation();
  const [saving, setSaving] = useState(false);

  const handleEnableLocation = async () => {
    getCurrentPosition();
  };

  React.useEffect(() => {
    if (latitude && longitude && !saving) {
      saveLocationToProfile();
    }
  }, [latitude, longitude]);

  const saveLocationToProfile = async () => {
    if (!user || !latitude || !longitude) return;

    setSaving(true);
    try {
      // Reverse geocode to get city/state
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();

      await supabase
        .from('profiles')
        .update({
          location_lat: latitude,
          location_lng: longitude,
          location_city: data.city || data.locality || 'Unknown',
          location_state: data.principalSubdivision || 'Unknown'
        })
        .eq('id', user.id);

      toast({
        title: "Location Updated",
        description: "Your location has been set for better matches!",
      });

      onLocationSet();
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Error",
        description: "Failed to save location. You can set it manually later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Location access was denied. You can still use the app, but you'll need to set your location manually for better matches.
          </p>
          <div className="flex gap-2">
            <Button onClick={onSkip} variant="outline" className="flex-1">
              Set Manually Later
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Enable Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Help us find the perfect matches near you! Your location is only used for matching and is never shared publicly.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm">Find matches nearby</span>
          </div>
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm">Get better recommendations</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm">Your exact location stays private</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={onSkip} 
            variant="outline" 
            className="flex-1"
            disabled={loading || saving}
          >
            Skip for Now
          </Button>
          <Button 
            onClick={handleEnableLocation} 
            className="flex-1"
            disabled={loading || saving}
          >
            {loading || saving ? 'Setting Location...' : 'Enable Location'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationPermissionPrompt;