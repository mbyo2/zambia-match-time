
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, X, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SwipeCard from './SwipeCard';

interface Profile {
  id: string;
  first_name: string;
  bio?: string;
  occupation?: string;
  education?: string;
  location_city?: string;
  location_state?: string;
  date_of_birth: string;
}

const DiscoverPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .eq('is_active', true)
        .limit(10);

      if (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Error",
          description: "Failed to load profiles",
          variant: "destructive",
        });
      } else {
        setProfiles(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass' | 'super_like') => {
    if (currentIndex >= profiles.length || !user) return;

    const currentProfile = profiles[currentIndex];

    try {
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

      // Move to next profile
      setCurrentIndex(currentIndex + 1);

      // Show success message for likes
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
          <Button onClick={fetchProfiles}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex flex-col items-center justify-center p-4">
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
