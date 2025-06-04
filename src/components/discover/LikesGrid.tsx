
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Lock, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LikeProfile {
  id: string;
  first_name: string;
  bio?: string;
  occupation?: string;
  location_city?: string;
  created_at: string;
}

const LikesGrid = () => {
  const { user } = useAuth();
  const { subscription, createCheckoutSession } = useSubscription();
  const { toast } = useToast();
  const [likes, setLikes] = useState<LikeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLikes();
    }
  }, [user]);

  const fetchLikes = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_views')
        .select(`
          viewer_id,
          created_at,
          profiles!viewer_id (
            id,
            first_name,
            bio,
            occupation,
            location_city
          )
        `)
        .eq('viewed_id', user?.id)
        .eq('view_type', 'like')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const likesData = data?.map(item => ({
        id: item.viewer_id,
        first_name: item.profiles.first_name,
        bio: item.profiles.bio,
        occupation: item.profiles.occupation,
        location_city: item.profiles.location_city,
        created_at: item.created_at,
      })) || [];

      setLikes(likesData);
    } catch (error) {
      console.error('Error fetching likes:', error);
      toast({
        title: "Error",
        description: "Failed to load likes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isPremium = subscription.tier !== 'free';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-pink-500" />
          People Who Liked You
        </h2>
        <p className="text-gray-600 mt-2">
          {isPremium ? 
            `${likes.length} people have liked your profile` : 
            'Upgrade to see who likes you'
          }
        </p>
      </div>

      {!isPremium ? (
        <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-red-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Lock className="h-12 w-12 text-pink-500" />
            </div>
            <CardTitle className="text-xl">Unlock Who Likes You</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              See everyone who has liked your profile and match instantly! 
              {likes.length > 0 && ` You have ${likes.length} likes waiting.`}
            </p>
            <Button 
              onClick={() => createCheckoutSession('price_basic_monthly')}
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Basic
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {likes.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No likes yet. Keep swiping to get more matches!</p>
            </div>
          ) : (
            likes.map((like) => (
              <Card key={like.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{like.first_name}</h3>
                    {like.occupation && (
                      <p className="text-sm text-gray-600">{like.occupation}</p>
                    )}
                    {like.location_city && (
                      <p className="text-sm text-gray-500">{like.location_city}</p>
                    )}
                    {like.bio && (
                      <p className="text-sm text-gray-700 line-clamp-2">{like.bio}</p>
                    )}
                    <Button className="w-full mt-3" size="sm">
                      <Heart className="h-4 w-4 mr-2" />
                      Like Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LikesGrid;
