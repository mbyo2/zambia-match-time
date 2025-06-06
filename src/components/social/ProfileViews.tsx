
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Eye, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

interface ProfileView {
  id: string;
  viewer: {
    id: string;
    first_name: string;
    profile_photos: { photo_url: string; is_primary: boolean }[];
  };
  view_type: string;
  created_at: string;
}

const ProfileViews = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [views, setViews] = useState<ProfileView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isPremium = subscription.tier !== 'free';

  useEffect(() => {
    if (user) {
      fetchProfileViews();
    }
  }, [user]);

  const fetchProfileViews = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_views')
        .select(`
          id,
          view_type,
          created_at,
          viewer:viewer_id (
            id,
            first_name,
            profile_photos (
              photo_url,
              is_primary
            )
          )
        `)
        .eq('viewed_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setViews(data || []);
    } catch (error) {
      console.error('Error fetching profile views:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isPremium) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Eye className="h-5 w-5" />
            Profile Views
            <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
              <Crown size={12} className="mr-1" />
              Premium
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-700">
            Upgrade to premium to see who has viewed your profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-500" />
          Profile Views
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {views.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="w-24 h-4 bg-gray-200 rounded" />
                  <div className="w-16 h-3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : views.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No profile views yet. Keep swiping to get noticed!
          </p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {views.map((view) => {
              const primaryPhoto = view.viewer.profile_photos?.find(p => p.is_primary);
              const photoUrl = primaryPhoto?.photo_url || view.viewer.profile_photos?.[0]?.photo_url;
              
              return (
                <div key={view.id} className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={photoUrl} alt={view.viewer.first_name} />
                    <AvatarFallback>
                      {view.viewer.first_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {view.viewer.first_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getTimeAgo(view.created_at)}
                    </p>
                  </div>
                  {view.view_type === 'super_view' && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                      <Star size={10} className="mr-1" />
                      Super
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileViews;
