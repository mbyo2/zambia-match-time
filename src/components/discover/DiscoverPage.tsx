
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, X, Star, Crown, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SwipeCard from './SwipeCard';
import SearchFilters from './SearchFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  interests?: string[];
  relationship_goals?: string[];
}

interface SearchPreferences {
  age_range: { min: number; max: number };
  distance: number;
  education_levels: string[];
  interests: string[];
  relationship_goals: string[];
  height_range: { min: number; max: number };
}

const DiscoverPage = () => {
  const { user } = useAuth();
  const { subscription, decrementSwipes, createCheckoutSession } = useSubscription();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchPreferences, setSearchPreferences] = useState<SearchPreferences>({
    age_range: { min: 18, max: 99 },
    distance: 50,
    education_levels: [],
    interests: [],
    relationship_goals: [],
    height_range: { min: 150, max: 200 }
  });

  useEffect(() => {
    if (user) {
      loadSearchPreferences();
    }
  }, [user]);

  useEffect(() => {
    if (user && !showFilters) {
      fetchProfiles();
    }
  }, [user, searchPreferences, showFilters]);

  const loadSearchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('search_preferences')
        .eq('id', user?.id)
        .single();

      if (data?.search_preferences) {
        setSearchPreferences(data.search_preferences);
      }
    } catch (error) {
      console.error('Error loading search preferences:', error);
    }
  };

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .eq('is_active', true);

      // Apply age filter
      const currentYear = new Date().getFullYear();
      const minBirthYear = currentYear - searchPreferences.age_range.max;
      const maxBirthYear = currentYear - searchPreferences.age_range.min;
      
      query = query
        .gte('date_of_birth', `${minBirthYear}-01-01`)
        .lte('date_of_birth', `${maxBirthYear}-12-31`);

      // Apply height filter if specified
      if (searchPreferences.height_range.min > 0) {
        query = query.gte('height_cm', searchPreferences.height_range.min);
      }
      if (searchPreferences.height_range.max < 220) {
        query = query.lte('height_cm', searchPreferences.height_range.max);
      }

      // Apply education filter
      if (searchPreferences.education_levels.length > 0) {
        query = query.in('education', searchPreferences.education_levels);
      }

      const { data, error } = await query.limit(20);

      if (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Error",
          description: "Failed to load profiles",
          variant: "destructive",
        });
      } else {
        // Filter by interests and relationship goals in memory
        let filteredProfiles = data || [];
        
        if (searchPreferences.interests.length > 0) {
          filteredProfiles = filteredProfiles.filter(profile => 
            profile.interests?.some(interest => 
              searchPreferences.interests.includes(interest)
            )
          );
        }

        if (searchPreferences.relationship_goals.length > 0) {
          filteredProfiles = filteredProfiles.filter(profile => 
            profile.relationship_goals?.some(goal => 
              searchPreferences.relationship_goals.includes(goal)
            )
          );
        }

        setProfiles(filteredProfiles);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const trackProfileView = async (viewedId: string, viewType: 'view' | 'like' | 'super_like') => {
    try {
      await supabase
        .from('profile_views')
        .upsert({
          viewer_id: user?.id,
          viewed_id: viewedId,
          view_type: viewType,
        }, {
          onConflict: 'viewer_id,viewed_id,view_type'
        });
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass' | 'super_like') => {
    if (currentIndex >= profiles.length || !user) return;

    // Check swipe limits for free users
    if (action !== 'pass') {
      const canSwipe = await decrementSwipes();
      if (!canSwipe) return;
    }

    const currentProfile = profiles[currentIndex];

    try {
      // Track the profile view
      if (action === 'like' || action === 'super_like') {
        await trackProfileView(currentProfile.id, action);
      }

      const { error } = await supabase
        .from('swipes')
        .insert({
          swiper_id: user.id,
          swiped_id: currentProfile.id,
          action: action,
        });

      if (error) {
        console.error('Error saving swipe:', error);
        toast({
          title: "Error",
          description: "Failed to save swipe",
          variant: "destructive",
        });
        return;
      }

      setCurrentIndex(currentIndex + 1);

      if (action === 'like' || action === 'super_like') {
        toast({
          title: action === 'super_like' ? "Super Like Sent! 💫" : "Like Sent! 💖",
          description: `You ${action === 'super_like' ? 'super liked' : 'liked'} ${currentProfile.first_name}`,
        });
      }

    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFiltersChange = (filters: SearchPreferences) => {
    setSearchPreferences(filters);
    setShowFilters(false);
  };

  // Show upgrade prompt if out of swipes
  if (subscription.remainingSwipes === 0 && subscription.tier === 'free') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Crown className="h-16 w-16 text-pink-500" />
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
              Out of Swipes!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              You've used all your daily swipes. Upgrade to get unlimited swipes and more features!
            </p>
            <Button 
              onClick={() => createCheckoutSession('price_basic_monthly')}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
            <p className="text-sm text-gray-500">
              Or wait until tomorrow for more free swipes
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showFilters) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center p-4">
        <SearchFilters 
          onFiltersChange={handleFiltersChange}
          onClose={() => setShowFilters(false)}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding amazing people for you...</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">That's everyone for now! 🎉</h2>
          <p className="text-gray-600 mb-6">Check back later for more profiles</p>
          <div className="space-x-4">
            <Button onClick={fetchProfiles}>
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setShowFilters(true)}>
              <Filter className="h-4 w-4 mr-2" />
              Adjust Filters
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex flex-col items-center justify-center p-4">
      {/* Filter button and swipes counter */}
      <div className="mb-4 flex items-center justify-between w-full max-w-sm">
        <Button variant="outline" size="sm" onClick={() => setShowFilters(true)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        
        {subscription.tier === 'free' && (
          <p className="text-sm text-gray-600">
            {subscription.remainingSwipes} swipes remaining today
          </p>
        )}
      </div>

      <div className="relative">
        <SwipeCard 
          profile={currentProfile}
          className="shadow-2xl"
        />
        
        <div className="flex justify-center gap-4 mt-8">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-16 h-16 border-red-300 text-red-500 hover:bg-red-50"
            onClick={() => handleSwipe('pass')}
          >
            <X size={24} />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-16 h-16 border-blue-300 text-blue-500 hover:bg-blue-50"
            onClick={() => handleSwipe('super_like')}
            disabled={subscription.tier === 'free'}
          >
            <Star size={24} />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-16 h-16 border-green-300 text-green-500 hover:bg-green-50"
            onClick={() => handleSwipe('like')}
          >
            <Heart size={24} />
          </Button>
        </div>
        
        <div className="text-center mt-4 text-sm text-gray-600">
          {profiles.length - currentIndex} profiles remaining
        </div>
      </div>
    </div>
  );
};

export default DiscoverPage;
