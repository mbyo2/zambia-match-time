
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStats } from '@/hooks/useUserStats';
import { useSwipeLimits } from '@/hooks/useSwipeLimits';
import SwipeCard from './SwipeCard';
import EnhancedSearchFilters from './EnhancedSearchFilters';
import SwipeLimitDisplay from './SwipeLimitDisplay';
import { Button } from '@/components/ui/button';
import { Filter, Shuffle } from 'lucide-react';

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
  profile_photos: { photo_url: string; is_primary: boolean }[];
  last_active?: string;
}

const DiscoverPage = () => {
  const { user } = useAuth();
  const { incrementStat } = useUserStats();
  const { canSwipe, consumeSwipe } = useSwipeLimits();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
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
    // For testing without auth, always load profiles
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      // For testing, directly query profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          bio,
          occupation,
          education,
          location_city,
          location_state,
          date_of_birth,
          height_cm,
          interests,
          relationship_goals,
          last_active
        `)
        .eq('is_active', true)
        .limit(10);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
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
        console.error('Error loading photos:', photosError);
      }

      // Combine profiles with their photos and add mock data
      const profilesWithPhotos = profilesData.map(profile => ({
        ...profile,
        profile_photos: photosData?.filter(photo => photo.user_id === profile.id) || [],
        distance_km: Math.floor(Math.random() * 50) + 1, // Mock distance
        compatibility_score: Math.floor(Math.random() * 100), // Mock compatibility
        boost_active: Math.random() > 0.8, // Random boost status
        date_of_birth: profile.date_of_birth.toString()
      }));

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
    
    try {
      // For testing without auth, just log the action
      console.log(`Swiped ${action} on ${currentProfile.first_name}`);
      
      // Simulate a match for likes (demo purposes)
      if (action === 'like' && Math.random() > 0.7) {
        console.log(`🎉 It's a match with ${currentProfile.first_name}!`);
      }

      // Move to next profile
      setCurrentIndex(prev => prev + 1);

      // Load more profiles if running low
      if (currentIndex >= profiles.length - 3) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4">
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
