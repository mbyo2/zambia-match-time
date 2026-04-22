
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStats } from '@/hooks/useUserStats';
import { useSwipeLimits } from '@/hooks/useSwipeLimits';
import { useDiscoveryRateLimit } from '@/hooks/useDiscoveryRateLimit';
import SwipeCard from './SwipeCard';
import EnhancedSearchFilters from './EnhancedSearchFilters';
import MatchCelebrationModal from './MatchCelebrationModal';
import ProfileDetailModal from './ProfileDetailModal';
import LocationPermissionPrompt from '../location/LocationPermissionPrompt';
import NotificationCenter from '../notifications/NotificationCenter';
import { Button } from '@/components/ui/button';
import { Filter, Undo2 } from 'lucide-react';
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
  profile_videos?: { video_url: string }[];
}

interface DiscoverPageProps {
  onNavigateToMatches?: () => void;
}

const DiscoverPage = ({ onNavigateToMatches }: DiscoverPageProps) => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { incrementStat } = useUserStats();
  const { canSwipe, consumeSwipe } = useSwipeLimits();
  const { checkRateLimit } = useDiscoveryRateLimit();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [lastSwipe, setLastSwipe] = useState<{ profile: Profile; index: number; action: string } | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [matchedMatchId, setMatchedMatchId] = useState<string | null>(null);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  // Track which matches/profiles we've already celebrated to prevent duplicates
  const celebratedRef = useRef<Set<string>>(new Set());
  const [detailProfile, setDetailProfile] = useState<Profile | null>(null);
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

  useEffect(() => {
    if (!authLoading && user) {
      checkLocationAndLoadProfiles();
    }
  }, [authLoading, user?.id]);

  // Realtime: show match modal when a new match involving me is created
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('new-matches-celebration')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches' },
        async (payload) => {
          const m: any = payload.new;
          if (!m) return;
          if (m.user1_id !== user.id && m.user2_id !== user.id) return;
          const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;

          // De-dupe: by match id AND by other user id, so multiple inserts or
          // a swipe-triggered modal can't be re-shown by realtime.
          if (
            celebratedRef.current.has(m.id) ||
            celebratedRef.current.has(otherId)
          ) return;
          celebratedRef.current.add(m.id);
          celebratedRef.current.add(otherId);

          // Try to use a profile already in our stack
          const cached = profiles.find(p => p.id === otherId);
          if (cached) {
            setMatchedProfile(cached);
            setMatchedMatchId(m.id);
            setShowMatchModal(true);
            return;
          }

          // Otherwise fetch minimal profile + primary photo
          const [{ data: prof }, { data: photos }] = await Promise.all([
            supabase.from('profiles').select('id, first_name').eq('id', otherId).single(),
            supabase
              .from('profile_photos')
              .select('photo_url, is_primary')
              .eq('user_id', otherId)
              .order('is_primary', { ascending: false })
              .limit(3),
          ]);

          if (prof) {
            setMatchedProfile({
              ...(prof as any),
              profile_photos: photos || [],
            } as any);
            setMatchedMatchId(m.id);
            setShowMatchModal(true);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, profiles]);

  const checkLocationAndLoadProfiles = async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('location_lat, location_lng')
        .eq('id', user.id)
        .single();

      if (error || !profile?.location_lat || !profile?.location_lng) {
        setShowLocationPrompt(true);
      }
      loadProfiles();
    } catch (error) {
      logger.error('Error checking location:', error);
      setShowLocationPrompt(true);
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      if (!user?.id) { setProfiles([]); setLoading(false); return; }

      const canProceed = await checkRateLimit();
      if (!canProceed) { setLoading(false); return; }

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

      if (profilesError) { logger.error('Error loading profiles:', profilesError); return; }
      if (!profilesData || profilesData.length === 0) { setProfiles([]); setCurrentIndex(0); return; }

      const profileIds = profilesData.map(p => p.id);
      const [{ data: photosData }, { data: videosData }] = await Promise.all([
        supabase
          .from('profile_photos')
          .select('user_id, photo_url, is_primary')
          .in('user_id', profileIds)
          .order('is_primary', { ascending: false })
          .order('order_index', { ascending: true }),
        supabase
          .from('profile_videos')
          .select('user_id, video_url')
          .in('user_id', profileIds),
      ]);

      const profilesWithPhotos = profilesData.map(profile => ({
        ...profile,
        profile_photos: photosData?.filter(photo => photo.user_id === profile.id) || [],
        profile_videos: videosData?.filter(v => v.user_id === profile.id) || [],
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
    setLastSwipe({ profile: currentProfile, index: currentIndex, action });

    if (user?.id && currentProfile.id === user.id) {
      setCurrentIndex(prev => prev + 1);
      return;
    }

    if (!canSwipe()) return;

    const previousIndex = currentIndex;
    setCurrentIndex(prev => prev + 1);

    if (currentIndex >= profiles.length - 3) loadProfiles();

    try {
      const swipeSuccess = await consumeSwipe();
      if (!swipeSuccess) { setCurrentIndex(previousIndex); return; }

      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({ swiper_id: user?.id, swiped_id: currentProfile.id, action });

      if (!swipeError) {
        if (action === 'like') incrementStat('likes_given');
        else if (action === 'super_like') incrementStat('super_likes_given');

        if (action === 'like' || action === 'super_like') {
          // Check for reciprocal like (they liked us first → match)
          const { data: reciprocal } = await supabase
            .from('swipes')
            .select('id')
            .eq('swiper_id', currentProfile.id)
            .eq('swiped_id', user?.id as string)
            .in('action', ['like', 'super_like'])
            .limit(1);

          if (reciprocal && reciprocal.length > 0) {
            if (!celebratedRef.current.has(currentProfile.id)) {
              celebratedRef.current.add(currentProfile.id);
              setMatchedProfile(currentProfile);
              // Match id will arrive via realtime; reset so the modal doesn't
              // reuse a stale id from a previous match.
              setMatchedMatchId(null);
              setShowMatchModal(true);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error handling swipe:', error);
    }
  };

  const handleUndo = async () => {
    if (!lastSwipe || isUndoing || !user?.id) return;
    setIsUndoing(true);
    try {
      const { error } = await supabase
        .from('swipes')
        .delete()
        .eq('swiper_id', user.id)
        .eq('swiped_id', lastSwipe.profile.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error) {
        setCurrentIndex(lastSwipe.index);
        setLastSwipe(null);
        toast({ title: "Undo!", description: "Swipe undone ↩️" });
      }
    } catch (error) {
      logger.error('Error in handleUndo:', error);
    } finally {
      setIsUndoing(false);
    }
  };

  if (showLocationPrompt) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <LocationPermissionPrompt
          onLocationSet={() => { setShowLocationPrompt(false); loadProfiles(); }}
          onSkip={() => { setShowLocationPrompt(false); loadProfiles(); }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="h-8 w-32 bg-muted animate-pulse rounded-lg" />
          <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />
        </div>
        <div className="flex-1 flex items-center justify-center px-4 pb-4">
          <div className="w-full max-w-sm aspect-[3/4] bg-muted animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 3);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-2xl font-bold text-primary tracking-tight">MatchTime</h1>
        <div className="flex gap-1 items-center">
          <NotificationCenter />
          {lastSwipe && (
            <Button variant="ghost" size="icon" onClick={handleUndo} disabled={isUndoing} className="rounded-full h-9 w-9">
              <Undo2 className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setShowFilters(!showFilters)} className="rounded-full h-9 w-9">
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="px-4 pb-3">
          <EnhancedSearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={() => { loadProfiles(); setShowFilters(false); }}
          />
        </div>
      )}

      {/* Card Stack */}
      <div className="flex-1 flex items-center justify-center px-4 pb-4">
        <div className="relative w-full max-w-sm aspect-[3/4]">
          {visibleProfiles.length > 0 ? (
            visibleProfiles.slice().reverse().map((profile, reversedIndex) => {
              const actualIndex = visibleProfiles.length - 1 - reversedIndex;
              const isTopCard = actualIndex === 0;
              return (
                <SwipeCard
                  key={profile.id}
                  profile={profile}
                  isTop={isTopCard}
                  onSwipe={isTopCard ? handleSwipe : undefined}
                  onTapProfile={(p) => setDetailProfile(p)}
                  style={{
                    transform: `scale(${1 - actualIndex * 0.04}) translateY(${actualIndex * 8}px)`,
                    zIndex: visibleProfiles.length - actualIndex,
                  }}
                />
              );
            })
          ) : (
            <div className="text-center space-y-4 p-8">
              <div className="text-6xl">✨</div>
              <h3 className="text-xl font-bold text-foreground">No more profiles</h3>
              <p className="text-muted-foreground text-sm">Check back later or adjust your filters</p>
              <Button onClick={loadProfiles} size="sm">Refresh</Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Detail Modal */}
      {detailProfile && (
        <ProfileDetailModal
          profile={detailProfile}
          open={!!detailProfile}
          onOpenChange={(open) => { if (!open) setDetailProfile(null); }}
          onSwipe={handleSwipe}
        />
      )}

      {/* Match Celebration */}
      <MatchCelebrationModal
        open={showMatchModal}
        onOpenChange={setShowMatchModal}
        matchedProfile={matchedProfile}
        isSendingMessage={isOpeningChat}
        onSendMessage={async () => {
          if (isOpeningChat) return;
          setIsOpeningChat(true);
          let success = false;
          try {
            // Resolve match id (realtime may not have arrived yet on the swiper side)
            let matchId = matchedMatchId;
            if (!matchId && matchedProfile && user?.id) {
              const { data: m } = await supabase
                .from('matches')
                .select('id')
                .or(`and(user1_id.eq.${user.id},user2_id.eq.${matchedProfile.id}),and(user1_id.eq.${matchedProfile.id},user2_id.eq.${user.id})`)
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();
              matchId = m?.id ?? null;
            }

            // Idempotent: server uses an advisory lock + check-then-insert,
            // so rapid double-taps return the same conversation id.
            if (matchId) {
              const { error } = await supabase.rpc(
                'get_or_create_conversation_for_match' as any,
                { p_match_id: matchId },
              );
              if (error) {
                logger.error('Error ensuring conversation:', error);
              } else {
                success = true;
                setMatchedMatchId(null);
              }
            } else {
              logger.error('No match id available to open chat');
            }
          } catch (e) {
            logger.error('Error opening chat from match modal:', e);
          } finally {
            setIsOpeningChat(false);
            if (success) {
              setShowMatchModal(false);
              onNavigateToMatches?.();
            } else {
              toast({
                title: "Couldn't open chat",
                description: 'Something went wrong. Please try again.',
                variant: 'destructive',
              });
            }
          }
        }}
        onKeepSwiping={() => setShowMatchModal(false)}
      />
    </div>
  );
};

export default DiscoverPage;
