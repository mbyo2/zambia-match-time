import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useDailyRewards } from '@/hooks/useDailyRewards';
import { supabase } from '@/integrations/supabase/client';
import UserStatsDisplay from '@/components/gamification/UserStatsDisplay';
import DailyRewardModal from '@/components/gamification/DailyRewardModal';
import IcebreakerPromptsSection from '@/components/prompts/IcebreakerPromptsSection';
import ProfileOverview from './ProfileOverview';
import ProfileSettings from './ProfileSettings';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Edit, Gift, Trophy, MessageCircle, Zap } from 'lucide-react';
import BoostProfile from '@/components/premium/BoostProfile';

interface ProfilePageProps {
  setCurrentTab: (tab: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ setCurrentTab }) => {
  const { user } = useAuth();
  const { todayReward } = useDailyRewards();
  const { isSuperAdmin } = useSuperAdmin();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLodgeManager, setIsLodgeManager] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPhotos();
      checkLodgeManager();
    }
  }, [user]);

  const checkLodgeManager = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'lodge_manager')
      .maybeSingle();
    setIsLodgeManager(!!data);
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!error) setProfile(data);
  };

  const fetchPhotos = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index', { ascending: true });
    if (!error) setPhotos(data || []);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <div className="flex gap-2">
          {todayReward && !todayReward.claimed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRewardModal(true)}
              className="animate-pulse"
            >
              <Gift className="mr-2 h-4 w-4" />
              Daily Reward!
            </Button>
          )}
          <Button onClick={() => setCurrentTab('profile-edit')}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">
            <Trophy className="mr-2 h-4 w-4" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="prompts">
            <MessageCircle className="mr-2 h-4 w-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="boost">
            <Zap className="mr-2 h-4 w-4" />
            Boost
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProfileOverview
            user={user}
            profile={profile}
            photos={photos}
            onPhotosUpdate={fetchPhotos}
            onNavigate={setCurrentTab}
          />
        </TabsContent>

        <TabsContent value="stats">
          <UserStatsDisplay />
        </TabsContent>

        <TabsContent value="prompts">
          <IcebreakerPromptsSection />
        </TabsContent>

        <TabsContent value="boost">
          <BoostProfile />
        </TabsContent>

        <TabsContent value="settings">
          <ProfileSettings
            isSuperAdmin={isSuperAdmin}
            isLodgeManager={isLodgeManager}
            onNavigate={setCurrentTab}
          />
        </TabsContent>
      </Tabs>

      <DailyRewardModal
        open={showRewardModal}
        onOpenChange={setShowRewardModal}
      />
    </div>
  );
};

export default ProfilePage;
