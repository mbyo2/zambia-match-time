
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SwipeCard from './SwipeCard';
import SearchFilters from './SearchFilters';
import SwipeLimitDisplay from './SwipeLimitDisplay';
import EmptyState from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, Heart, X, RefreshCw, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSwipeLimits } from '@/hooks/useSwipeLimits';
import { SearchPreferences, jsonToSearchPreferences, searchPreferencesToJson } from '@/types/search';

interface Profile {
  id: string;
  first_name: string;
  bio?: string;
  occupation?: string;
  education?: string;
  location_city?: string;
  location_state?: string;
  date_of_birth: string;
  height_cm?: number;
  interests: string[];
  relationship_goals: string[];
  distance_km?: number;
  compatibility_score?: number;
  profile_photos: { photo_url: string; is_primary: boolean }[];
}

const DiscoverPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canSwipe, consumeSwipe, refreshLimits } = useSwipeLimits();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [preferences, setPreferences] = useState<SearchPreferences>({
    age_range: { min: 18, max: 99 },
    distance: 50,
    education_levels: [],
    interests: [],
    relationship_goals: [],
    height_range: { min: 150, max: 200 }
  });

  useEffect(() => {
    if (user) {
      fetchUserPreferences();
      fetchProfiles();
    }
  }, [user]);

  const fetchUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('search_preferences')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching preferences:', error);
        return;
      }

      if (data?.search_preferences) {
        setPreferences(jsonToSearchPreferences(data.search_preferences));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateUserPreferences = async (newPreferences: SearchPreferences) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ search_preferences: searchPreferencesToJson(newPreferences) })
        .eq('id', user?.id);

      if (error) {
        console.error('Error updating preferences:', error);
        return;
      }

      setPreferences(newPreferences);
      fetchProfiles();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchProfiles = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_compatible_profiles', {
          user_uuid: user.id,
          max_distance: preferences.distance,
          age_min: preferences.age_range.min,
          age_max: preferences.age_range.max,
          filter_education_levels: preferences.education_levels,
          filter_interests: preferences.interests,
          filter_relationship_goals: preferences.relationship_goals,
          height_min: preferences.height_range.min,
          height_max: preferences.height_range.max
        });

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      // Get profile photos for each profile
      const profilesWithPhotos = await Promise.all(
        (data || []).map(async (profile: any) => {
          const { data: photos } = await supabase
            .from('profile_photos')
            .select('photo_url, is_primary')
            .eq('user_id', profile.id)
            .order('order_index');

          return {
            ...profile,
            profile_photos: photos || []
          };
        })
      );

      setProfiles(profilesWithPhotos);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (profileId: string, action: 'like' | 'pass') => {
    if (!canSwipe()) {
      return;
    }

    const swipeAllowed = await consumeSwipe();
    if (!swipeAllowed) {
      return;
    }

    try {
      // Record the swipe
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({
          swiper_id: user?.id,
          swiped_id: profileId,
          action: action
        });

      if (swipeError) {
        console.error('Error recording swipe:', swipeError);
        return;
      }

      // Move to next profile
      setCurrentIndex(prev => prev + 1);
      refreshLimits();

      if (action === 'like') {
        toast({
          title: "Liked! 💖",
          description: "Hope it's a match!",
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const currentProfile = profiles[currentIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Discover</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white"
          >
            <Filter size={20} />
          </Button>
        </div>

        {/* Swipe Limit Display */}
        <SwipeLimitDisplay />

        {/* Search Filters */}
        {showFilters && (
          <div className="mb-6">
            <SearchFilters 
              preferences={preferences}
              onPreferencesChange={updateUserPreferences}
            />
          </div>
        )}

        {/* Main Content */}
        {!currentProfile || currentIndex >= profiles.length ? (
          <EmptyState
            icon={<Heart className="h-16 w-16" />}
            title="No more profiles"
            description={profiles.length === 0 
              ? "No profiles match your current filters. Try adjusting your preferences or check back later!"
              : "You've seen all available profiles. Try adjusting your filters or check back later for new people!"
            }
            action={{
              label: profiles.length === 0 ? "Adjust Filters" : "Refresh",
              onClick: profiles.length === 0 ? () => setShowFilters(true) : fetchProfiles
            }}
          />
        ) : (
          <>
            <SwipeCard 
              profile={currentProfile}
              onSwipe={handleSwipe}
            />

            {/* Action Buttons */}
            <div className="flex justify-center gap-6 mt-6">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full w-16 h-16 border-red-200 hover:bg-red-50"
                onClick={() => handleSwipe(currentProfile.id, 'pass')}
                disabled={!canSwipe()}
              >
                <X size={24} className="text-red-500" />
              </Button>
              
              <Button
                size="lg"
                className="rounded-full w-16 h-16 bg-pink-500 hover:bg-pink-600"
                onClick={() => handleSwipe(currentProfile.id, 'like')}
                disabled={!canSwipe()}
              >
                <Heart size={24} />
              </Button>
            </div>

            {!canSwipe() && (
              <div className="mt-4 text-center">
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="py-3">
                    <p className="text-sm text-amber-800">
                      Daily limit reached. Upgrade for unlimited swipes!
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
