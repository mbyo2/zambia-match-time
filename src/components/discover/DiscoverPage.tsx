import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SwipeCard from './SwipeCard';
import SearchFilters from './SearchFilters';
import SwipeLimitDisplay from './SwipeLimitDisplay';
import EmptyState from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, Heart, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSwipeLimits } from '@/hooks/useSwipeLimits';
import { SearchPreferences, jsonToSearchPreferences, searchPreferencesToJson } from '@/types/search';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

const defaultPreferences: SearchPreferences = {
  age_range: { min: 18, max: 99 },
  distance: 50,
  education_levels: [],
  interests: [],
  relationship_goals: [],
  height_range: { min: 150, max: 200 }
};

const DiscoverPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canSwipe, consumeSwipe, refreshLimits } = useSwipeLimits();
  const queryClient = useQueryClient();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch user preferences with React Query
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('search_preferences')
        .eq('id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore no rows found error
        console.error('Error fetching preferences:', error);
        return defaultPreferences;
      }
      
      return data?.search_preferences ? jsonToSearchPreferences(data.search_preferences) : defaultPreferences;
    },
    enabled: !!user,
  });

  // Update user preferences with React Query useMutation
  const { mutate: updateUserPreferences } = useMutation({
    mutationFn: async (newPreferences: SearchPreferences) => {
      const { error } = await supabase
        .from('profiles')
        .update({ search_preferences: searchPreferencesToJson(newPreferences) })
        .eq('id', user!.id);

      if (error) throw error;
      
      return newPreferences;
    },
    onSuccess: (newPreferences) => {
      queryClient.setQueryData(['userPreferences', user?.id], newPreferences);
      queryClient.invalidateQueries({ queryKey: ['compatibleProfiles'] });
      toast({
        title: "Preferences saved!",
        description: "Your discovery feed is being updated.",
      });
    },
    onError: (error) => {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Could not save your preferences.",
        variant: "destructive"
      });
    }
  });

  // Fetch compatible profiles with React Query
  const { data: profiles, isLoading: isLoadingProfiles, refetch: refetchProfiles } = useQuery({
    queryKey: ['compatibleProfiles', user?.id, preferences],
    queryFn: async () => {
      if (!user || !preferences) return [];

      const { data, error } = await supabase
        .rpc('get_compatible_profiles', {
          user_uuid: user.id,
          p_max_distance: preferences.distance,
          p_age_min: preferences.age_range.min,
          p_age_max: preferences.age_range.max,
          p_filter_education_levels: preferences.education_levels,
          p_filter_interests: preferences.interests,
          p_filter_relationship_goals: preferences.relationship_goals,
          p_height_min: preferences.height_range.min,
          p_height_max: preferences.height_range.max
        });

      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }
      
      const profilesWithPhotos = await Promise.all(
        (data || []).map(async (profile: any) => {
          const { data: photos } = await supabase
            .from('profile_photos')
            .select('photo_url, is_primary')
            .eq('user_id', profile.id)
            .order('order_index');

          return { ...profile, profile_photos: photos || [] };
        })
      );

      return profilesWithPhotos;
    },
    enabled: !!user && !!preferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Reset index when profiles change
  useEffect(() => {
    setCurrentIndex(0);
  }, [profiles]);

  // Handle swipe action with React Query useMutation
  const { mutate: handleSwipe, isPending: isSwiping } = useMutation({
    mutationFn: async ({ profileId, action }: { profileId: string, action: 'like' | 'pass'}) => {
      if (!canSwipe()) throw new Error("Daily swipe limit reached.");
      
      const swipeAllowed = await consumeSwipe();
      if (!swipeAllowed) throw new Error("Could not consume swipe.");

      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({ swiper_id: user?.id, swiped_id: profileId, action: action });

      if (swipeError) {
        console.error('Error recording swipe:', swipeError);
        throw swipeError;
      }
      
      return { action };
    },
    onSuccess: ({ action }) => {
      setCurrentIndex(prev => prev + 1);
      refreshLimits();

      if (action === 'like') {
        toast({
          title: "Liked! 💖",
          description: "Hope it's a match!",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Swipe Error",
        description: error.message || "An error occurred while swiping.",
        variant: "destructive"
      });
    }
  });

  const isLoading = isLoadingPreferences || isLoadingProfiles;
  const currentProfile = profiles?.[currentIndex];

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
              preferences={preferences || defaultPreferences}
              onPreferencesChange={updateUserPreferences}
            />
          </div>
        )}

        {/* Main Content */}
        {!currentProfile ? (
          <EmptyState
            icon={<Heart className="h-16 w-16" />}
            title="No more profiles"
            description={(profiles || []).length === 0 
              ? "No profiles match your current filters. Try adjusting your preferences or check back later!"
              : "You've seen all available profiles. Try adjusting your filters or check back later for new people!"
            }
            action={{
              label: (profiles || []).length === 0 ? "Adjust Filters" : "Refresh",
              onClick: (profiles || []).length === 0 ? () => setShowFilters(true) : () => refetchProfiles()
            }}
          />
        ) : (
          <>
            <SwipeCard 
              profile={currentProfile}
              onSwipe={(profileId, action) => handleSwipe({ profileId, action })}
            />

            {/* Action Buttons */}
            <div className="flex justify-center gap-6 mt-6">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full w-16 h-16 border-red-200 hover:bg-red-50"
                onClick={() => handleSwipe({profileId: currentProfile.id, action: 'pass'})}
                disabled={!canSwipe() || isSwiping}
              >
                <X size={24} className="text-red-500" />
              </Button>
              
              <Button
                size="lg"
                className="rounded-full w-16 h-16 bg-pink-500 hover:bg-pink-600"
                onClick={() => handleSwipe({profileId: currentProfile.id, action: 'like'})}
                disabled={!canSwipe() || isSwiping}
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
