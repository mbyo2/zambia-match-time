import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Heart, Lock, Crown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LikerProfile {
  id: string;
  first_name: string;
  age: number;
  photo_url: string | null;
  created_at: string;
}

const WhoLikedYou = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [likers, setLikers] = useState<LikerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const isPremium = subscription.tier !== 'free';

  useEffect(() => {
    if (user) fetchLikers();
  }, [user]);

  const fetchLikers = async () => {
    if (!user) return;
    setLoading(false);
    try {
      // Get users who liked us but we haven't swiped on yet
      const { data: swipesOnUs, error: swipesError } = await supabase
        .from('swipes')
        .select('swiper_id, created_at')
        .eq('swiped_id', user.id)
        .in('action', ['like', 'super_like'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (swipesError || !swipesOnUs?.length) {
        setLikers([]);
        return;
      }

      // Check which we've already swiped on (already matched or passed)
      const likerIds = swipesOnUs.map(s => s.swiper_id);
      const { data: ourSwipes } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id)
        .in('swiped_id', likerIds);

      const alreadySwiped = new Set(ourSwipes?.map(s => s.swiped_id) || []);
      const pendingLikers = swipesOnUs.filter(s => !alreadySwiped.has(s.swiper_id));

      if (pendingLikers.length === 0) {
        setLikers([]);
        return;
      }

      // Get profiles using RPC for safe data
      const pendingIds = pendingLikers.map(s => s.swiper_id);
      const profiles: LikerProfile[] = [];

      for (const likerId of pendingIds.slice(0, 12)) {
        const { data: safeProfile } = await supabase.rpc('get_safe_profile_data', { profile_id: likerId });
        if (safeProfile && safeProfile.length > 0) {
          const p = safeProfile[0];
          // Get photo
          const { data: photos } = await supabase
            .from('profile_photos')
            .select('photo_url')
            .eq('user_id', likerId)
            .eq('is_primary', true)
            .limit(1);
          
          profiles.push({
            id: likerId,
            first_name: p.first_name,
            age: p.age,
            photo_url: photos?.[0]?.photo_url || null,
            created_at: pendingLikers.find(s => s.swiper_id === likerId)?.created_at || '',
          });
        }
      }

      setLikers(profiles);
    } catch (error) {
      console.error('Error fetching likers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <h3 className="font-semibold text-foreground">Who Liked You</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (likers.length === 0) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <h3 className="font-semibold text-foreground">Who Liked You</h3>
          <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {likers.length}
          </span>
        </div>
        {!isPremium && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            Premium
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {likers.slice(0, isPremium ? 12 : 4).map((liker) => (
          <div
            key={liker.id}
            className={cn(
              "relative aspect-[3/4] rounded-2xl overflow-hidden group",
              !isPremium && "cursor-not-allowed"
            )}
          >
            {/* Photo */}
            <img
              src={liker.photo_url || '/placeholder.svg'}
              alt=""
              className={cn(
                "w-full h-full object-cover",
                !isPremium && "blur-lg scale-110"
              )}
            />

            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* Blur overlay for free users */}
            {!isPremium && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-md flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
              </div>
            )}

            {/* Name overlay (premium only) */}
            {isPremium && (
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-semibold text-sm">{liker.first_name}, {liker.age}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upgrade CTA for free users */}
      {!isPremium && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {likers.length} {likers.length === 1 ? 'person likes' : 'people like'} you
              </p>
              <p className="text-xs text-muted-foreground">
                Upgrade to see who and match instantly
              </p>
            </div>
          </div>
          <Button className="w-full mt-3" size="sm">
            <Crown className="w-4 h-4 mr-1" />
            Unlock with Premium
          </Button>
        </div>
      )}
    </div>
  );
};

export default WhoLikedYou;
