import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStats } from '@/hooks/useUserStats';
import { useSwipeLimits } from '@/hooks/useSwipeLimits';
import { useProfileCompletion } from '../profile/ProfileCompletionChecker';
import SwipeCard from './SwipeCard';
import EnhancedSearchFilters from './EnhancedSearchFilters';
import SwipeLimitDisplay from './SwipeLimitDisplay';
import ProfileCompletionBanner from '../profile/ProfileCompletionBanner';
import LocationPermissionPrompt from '../location/LocationPermissionPrompt';
import { Button } from '@/components/ui/button';
import { Filter, Shuffle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  first_name: string;
  bio: string;
  occupation: string;
  education: string;
  location_city: string;
  location_state: string;
  date_of_birth: string;
  height_cm: number;
  interests: string[];
  relationship_goals: string[];
  distance_km: number;
  compatibility_score: number;
  boost_active: boolean;
  last_active: string;
  profile_photos: { photo_url: string; is_primary: boolean }[];
}

const DiscoverPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { incrementStat } = useUserStats();
  const { canSwipe, consumeSwipe } = useSwipeLimits();
  const { status: profileStatus } = useProfileCompletion();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [filters, setFilters] = useState({
    ageRange: [18, 99] as [number, number],
    heightRange: [150, 200] as [number, number],
    distance: 50,
    education: [] as string[],
    interests: [] as string[],
    relationshipGoals: [] as string[],
    bodyTypes: [] as string[],
    ethnicities: [] as string[],
    religion: '',
    smoking: '',
    drinking: ''
  });

  useEffect(() => {
    if (!authLoading && user) {
      checkLocationAndLoadProfiles();
    }
  }, [authLoading, user?.id]);

  const checkLocationAndLoadProfiles = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('location_lat, location_lng')
        .eq('id', user?.id)
        .single();

      if (!profile?.location_lat || !profile?.location_lng) {
        setNeedsLocation(true);
        setShowLocationPrompt(true);
      } else {
        setNeedsLocation(false);
        loadProfiles();
      }
    } catch (error) {
      console.error('Error checking location:', error);
      loadProfiles(); // Load anyway
    }
  };

  const loadProfiles = async () => {
    setLoading(true);
    console.log('Loading profiles for user:', user?.id);
    try {
      if (!user?.id) {
        console.log('No user ID available');
        setProfiles([]);
        setLoading(false);
        return;
      }

      console.log('Calling get_discovery_profiles with filters:', filters);
      
      // Use the main discovery function with all available filters
      const { data: profilesData, error: profilesError } = await supabase.rpc('get_discovery_profiles', {
        user_uuid: user.id,
        p_max_distance: filters.distance,
        p_age_min: filters.ageRange[0],
        p_age_max: filters.ageRange[1],
        p_filter_education_levels: filters.education,
        p_filter_interests: filters.interests,
        p_filter_relationship_goals: filters.relationshipGoals,
        p_height_min: filters.heightRange[0],
        p_height_max: filters.heightRange[1],
        p_body_types: filters.bodyTypes,
        p_ethnicities: filters.ethnicities,
        p_religion: filters.religion,
        p_smoking: filters.smoking,
        p_drinking: filters.drinking
      });

      console.log('Profile data response:', profilesData?.length || 0, 'profiles');
      console.log('Profile error:', profilesError);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        return;
      }

      if (!profilesData || profilesData.length === 0) {
        console.log('No profiles found, setting empty array');
        setProfiles([]);
        setCurrentIndex(0);
        return;
      }

      // Get profile photos for each profile
      const profileIds = profilesData.map(p => p.id);
      console.log('Loading photos for profile IDs:', profileIds.slice(0, 3));
      
      const { data: photosData, error: photosError } = await supabase
        .from('profile_photos')
        .select('user_id, photo_url, is_primary')
        .in('user_id', profileIds)
        .order('is_primary', { ascending: false })
        .order('order_index', { ascending: true });

      if (photosError) {
        console.error('Error loading photos:', photosError);
      } else {
        console.log('Loaded photos for', photosData?.length || 0, 'photos');
      }

      // Combine profiles with their photos
      const profilesWithPhotos = profilesData.map(profile => ({
        ...profile,
        profile_photos: photosData?.filter(photo => photo.user_id === profile.id) || []
      }));

      console.log('Final profiles with photos:', profilesWithPhotos.length);
      setProfiles(profilesWithPhotos);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error in loadProfiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass' | 'super_like') => {
    if (currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];
    
    // Safety guard: never allow swiping on your own profile
    if (user?.id && currentProfile.id === user.id) {
      console.log('Skipping own profile');
      setCurrentIndex(prev => prev + 1);
      return;
    }

    // Check swipe limits and consume swipe
    if (!canSwipe()) {
      console.log('Swipe limit reached');
      return;
    }

    const success = await consumeSwipe();
    if (!success) {
      console.log('Failed to consume swipe');
      return;
    }
    
    try {
      // Record the swipe in the database
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({
          swiper_id: user?.id,
          swiped_id: currentProfile.id,
          action: action
        });

      if (swipeError) {
        console.error('Error recording swipe:', swipeError);
      } else {
        console.log(`Swiped ${action} on ${currentProfile.first_name}`);
        
        // Update user stats
        if (action === 'like') {
          incrementStat('likes_given');
        } else if (action === 'super_like') {
          incrementStat('super_likes_given');
        }
      }

      // Move to next profile
      setCurrentIndex(prev => prev + 1);

      // Load more profiles if running low
      if (currentIndex >= profiles.length - 3) {
        console.log('Loading more profiles...');
        loadProfiles();
      }
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  };

  const shuffleProfiles = () => {
    const shuffled = [...profiles].sort(() => Math.random() - 0.5);
    setProfiles(shuffled);
    setCurrentIndex(0);
  };

  const currentProfile = profiles[currentIndex];

  if (showLocationPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 p-4 flex items-center justify-center">
        <LocationPermissionPrompt
          onLocationSet={() => {
            setShowLocationPrompt(false);
            setNeedsLocation(false);
            loadProfiles();
          }}
          onSkip={() => {
            setShowLocationPrompt(false);
            setNeedsLocation(false);
            loadProfiles();
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Discover</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={shuffleProfiles}
              disabled={profiles.length === 0}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Profile Completion Banner */}
        {profileStatus.completionPercentage < 100 && (
          <ProfileCompletionBanner 
            onEditProfile={() => {
              toast({
                title: "Edit Profile",
                description: "Navigate to profile tab to edit your profile",
              });
            }} 
          />
        )}

        {/* Swipe Limit Display */}
        <SwipeLimitDisplay />

        {/* Filters */}
        {showFilters && (
          <EnhancedSearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={() => {
              loadProfiles();
              setShowFilters(false);
            }}
          />
        )}

        {/* Main Card Area */}
        <div className="relative h-[600px] flex items-center justify-center">
          {currentProfile ? (
            <SwipeCard
              profile={currentProfile}
              onSwipe={handleSwipe}
            />
          ) : (
            <div className="text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-800">
                  No more profiles for now!
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or check back later for new matches.
                </p>
                <Button onClick={loadProfiles} className="mt-4">
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Counter */}
        {profiles.length > 0 && (
          <div className="text-center text-sm text-gray-600">
            {currentIndex + 1} of {profiles.length} profiles
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;