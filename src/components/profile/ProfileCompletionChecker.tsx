import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCompletionStatus {
  hasBasicInfo: boolean;
  hasPhotos: boolean;
  hasBio: boolean;
  hasLocation: boolean;
  completionPercentage: number;
  missingFields: string[];
}

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ProfileCompletionStatus>({
    hasBasicInfo: false,
    hasPhotos: false,
    hasBio: false,
    hasLocation: false,
    completionPercentage: 0,
    missingFields: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkProfileCompletion();
    }
  }, [user]);

  const checkProfileCompletion = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: photos } = await supabase
        .from('profile_photos')
        .select('id')
        .eq('user_id', user.id);

      const hasBasicInfo = !!(profile?.first_name && profile?.date_of_birth && profile?.gender);
      const hasPhotos = (photos?.length || 0) > 0;
      const hasBio = !!(profile?.bio && profile.bio.length > 20);
      const hasLocation = !!(profile?.location_city && profile?.location_state);

      const missingFields: string[] = [];
      if (!hasBasicInfo) missingFields.push('Basic information');
      if (!hasPhotos) missingFields.push('Profile photos');
      if (!hasBio) missingFields.push('Bio');
      if (!hasLocation) missingFields.push('Location');

      const completionPercentage = Math.round(
        ([hasBasicInfo, hasPhotos, hasBio, hasLocation].filter(Boolean).length / 4) * 100
      );

      setStatus({
        hasBasicInfo,
        hasPhotos,
        hasBio,
        hasLocation,
        completionPercentage,
        missingFields
      });
    } catch (error) {
      console.error('Error checking profile completion:', error);
    } finally {
      setLoading(false);
    }
  };

  return { status, loading, refreshStatus: checkProfileCompletion };
};
