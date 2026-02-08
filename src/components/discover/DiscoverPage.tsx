import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStats } from '@/hooks/useUserStats';
import { useSwipeLimits } from '@/hooks/useSwipeLimits';
import { useDiscoveryRateLimit } from '@/hooks/useDiscoveryRateLimit';
import { useProfileCompletion } from '../profile/ProfileCompletionChecker';
import SwipeCard from './SwipeCard';
import EnhancedSearchFilters from './EnhancedSearchFilters';
import SwipeLimitDisplay from './SwipeLimitDisplay';
import ProfileCompletionBanner from '../profile/ProfileCompletionBanner';
import LocationPermissionPrompt from '../location/LocationPermissionPrompt';
import { Button } from '@/components/ui/button';
import { Filter, Shuffle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface Profile {
  id: string;
  first_name: string;
  age: number;
  bio: string;
  occupation: string;
  education: string;
  height_cm: number;
  interests: string[];
  looking_for: string[];
  location_city: string;
  location_state: string;
  distance_km: number;
  compatibility_score: number;
  is_verified: boolean;
  professional_badge: string;
  has_accommodation_available: boolean;
  profile_photos: { photo_url: string; is_primary: boolean }[];
}

const DiscoverPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { incrementStat } = useUserStats();
  const { canSwipe, consumeSwipe } = useSwipeLimits();
  const { checkRateLimit, rateLimitState } = useDiscoveryRateLimit();
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

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && user) {
      checkLocationAndLoadProfiles();
    }
  }, [authLoading, user?.id]);

  const checkLocationAndLoadProfiles = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('location_lat, location_lng')
        .eq('id', user.id)
        .single();

      if (error) {
        logger.error('Error fetching profile location:', error);
        setNeedsLocation(true);
        setShowLocationPrompt(true);
        setLoading(false);
        return;
      }

      if (!profile?.location_lat || !profile?.location_lng) {
        setNeedsLocation(true);
        setShowLocationPrompt(true);
        setLoading(false);
      } else {
        setNeedsLocation(false);
        loadProfiles();
      }
    } catch (error) {
      logger.error('Error checking location:', error);
      setNeedsLocation(true);
      setShowLocationPrompt(true);
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Check rate limit before loading profiles
      const canProceed = await checkRateLimit();
      if (!canProceed) {
        setLoading(false);
        return;
      }

      // Use the main discovery function with filters as JSON
      const { data: profilesData, error: profilesError } = await supabase.rpc('get_discovery_profiles', {
        _user_id: user.id,
        _filters: {
          max_distance: filters.distance,
          age_min: filters.ageRange[0],
          age_max: filters.ageRange[1],
          education_levels: filters.education,
          interests: filters.interests,
          relationship_goals: filters.relationshipGoals,
          height_min: filters.heightRange[0],
          height_max: filters.heightRange[1],
          body_types: filters.bodyTypes,
          ethnicities: filters.ethnicities,
          religion: filters.religion,
          smoking: filters.smoking,
          drinking: filters.drinking
        }
      });

      if (profilesError) {
        logger.error('Error loading profiles:', profilesError);
        return;
      }

      if (!profilesData || profilesData.length === 0) {
        setProfiles([]);
        setCurrentIndex(0);
        return;
      }

      // Get profile photos for each profile
      const profileIds = profilesData.map(p => p.id);
      
      const { data: photosData, error: photosError } = await supabase
        .from('profile_photos')
        .select('user_id, photo_url, is_primary')
        .in('user_id', profileIds)
        .order('is_primary', { ascending: false })
        .order('order_index', { ascending: true });

      if (photosError) {
        logger.error('Error loading photos:', photosError);
      }

      // Combine profiles with their photos
      const profilesWithPhotos = profilesData.map(profile => ({
        ...profile,
        profile_photos: photosData?.filter(photo => photo.user_id === profile.id) || []
      }));

      setProfiles(profilesWithPhotos);
      setCurrentIndex(0);
    } catch (error) {
      logger.error('Error in loadProfiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass' | 'super_like') => {
    if (currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];
    
    // Safety guard: never allow swiping on your own profile
    if (user?.id && currentProfile.id === user.id) {
      setCurrentIndex(prev => prev + 1);
      return;
    }

    // Check swipe limits
    if (!canSwipe()) {
      return;
    }

    // OPTIMISTIC UPDATE: Move to next profile immediately
    const previousIndex = currentIndex;
    setCurrentIndex(prev => prev + 1);

    // Load more profiles if running low
    if (currentIndex >= profiles.length - 3) {
      loadProfiles();
    }

    try {
      // Consume swipe in background
      const swipeSuccess = await consumeSwipe();
      if (!swipeSuccess) {
        // Rollback on swipe limit failure
        setCurrentIndex(previousIndex);
        return;
      }
      
      // Record the swipe in the database
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({
          swiper_id: user?.id,
          swiped_id: currentProfile.id,
          action: action
        });

      if (swipeError) {
        logger.error('Error recording swipe:', swipeError);
        // Don't rollback UI - user already saw next profile
      } else {
        // Update user stats in background
        if (action === 'like') {
          incrementStat('likes_given');
        } else if (action === 'super_like') {
          incrementStat('super_likes_given');
        }
      }
    } catch (error) {
      logger.error('Error handling swipe:', error);
      // Don't rollback - optimistic update already happened
    }
  };

  const shuffleProfiles = () => {
    const shuffled = [...profiles].sort(() => Math.random() - 0.5);
    setProfiles(shuffled);
    setCurrentIndex(0);
  };

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY.current;
    
    if (diff > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      setPullDistance(Math.min(diff * 0.5, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      await loadProfiles();
      toast({
        title: "Refreshed",
        description: "Profile feed updated",
      });
      setIsRefreshing(false);
    }
    setPullDistance(0);
    touchStartY.current = 0;
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Get visible profiles for card stack (current + next 2)
  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 3);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-200"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance / 100
        }}
      >
        <div className="bg-background border border-border rounded-full p-3 shadow-lg mt-4">
          <RefreshCw 
            className={`h-5 w-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${pullDistance * 3.6}deg)`
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <h1 className="text-2xl font-bold text-foreground">Discover</h1>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={shuffleProfiles}
            disabled={profiles.length === 0}
            className="rounded-full"
          >
            <Shuffle className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-full"
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Profile Completion Banner */}
      {profileStatus.completionPercentage < 100 && (
        <div className="px-4 animate-fade-in">
          <ProfileCompletionBanner 
            onEditProfile={() => {
              toast({
                title: "Complete Your Profile",
                description: "A complete profile gets 3x more matches!",
                duration: 3000,
              });
            }} 
          />
        </div>
      )}

      {/* Swipe Limit Display */}
      <div className="px-4 py-2">
        <SwipeLimitDisplay />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 pb-4">
          <EnhancedSearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={() => {
              loadProfiles();
              setShowFilters(false);
            }}
          />
        </div>
      )}

      {/* Card Stack Area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-4">
        <div className="relative w-full max-w-sm aspect-[3/4]">
          {visibleProfiles.length > 0 ? (
            <>
              {/* Render cards in reverse order so first is on top */}
              {visibleProfiles.slice().reverse().map((profile, reversedIndex) => {
                const actualIndex = visibleProfiles.length - 1 - reversedIndex;
                const isTopCard = actualIndex === 0;
                
                return (
                  <SwipeCard
                    key={profile.id}
                    profile={profile}
                    isTop={isTopCard}
                    onSwipe={isTopCard ? handleSwipe : undefined}
                    style={{
                      transform: `scale(${1 - actualIndex * 0.04}) translateY(${actualIndex * 8}px)`,
                      zIndex: visibleProfiles.length - actualIndex,
                    }}
                  />
                );
              })}
            </>
          ) : (
            <div className="text-center space-y-6 p-8">
              <div className="text-7xl">💫</div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground">
                  That's everyone!
                </h3>
                <p className="text-muted-foreground">
                  Check back later for new people, or adjust your discovery settings.
                </p>
                <Button onClick={loadProfiles} className="mt-6" size="lg">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Counter */}
      {profiles.length > 0 && currentIndex < profiles.length && (
        <div className="text-center pb-4 text-sm text-muted-foreground">
          {currentIndex + 1} of {profiles.length}
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;