
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStats } from '@/hooks/useUserStats';
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
}

const DiscoverPage = () => {
  const { user } = useAuth();
  const { incrementStat } = useUserStats();
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
    if (user) {
      loadProfiles();
    }
  }, [user]);

  const loadProfiles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_enhanced_compatible_profiles', {
        user_uuid: user.id,
        p_max_distance: filters.distance,
        p_age_min: filters.ageRange[0],
        p_age_max: filters.ageRange[1],
        p_height_min: filters.heightRange[0],
        p_height_max: filters.heightRange[1],
        p_filter_education_levels: filters.education,
        p_filter_interests: filters.interests,
        p_filter_relationship_goals: filters.relationshipGoals,
        p_body_types: filters.bodyTypes,
        p_ethnicities: filters.ethnicities,
        p_religion: filters.religion,
        p_smoking: filters.smoking,
        p_drinking: filters.drinking
      });

      if (error) {
        console.error('Error loading profiles:', error);
        return;
      }

      setProfiles(data || []);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error in loadProfiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass' | 'super_like') => {
    if (!user || currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];
    
    try {
      // Record the swipe
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({
          swiper_id: user.id,
          swiped_id: currentProfile.id,
          action
        });

      if (swipeError) {
        console.error('Error recording swipe:', swipeError);
        return;
      }

      // Update stats
      if (action === 'like') {
        await incrementStat('likes_given');
      } else if (action === 'super_like') {
        await incrementStat('super_likes_given');
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
