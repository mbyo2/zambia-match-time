import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ProfileSetup from './profile/ProfileSetup';
import DiscoverPage from './discover/DiscoverPage';
import SubscriptionPage from './subscription/SubscriptionPage';
import { Button } from '@/components/ui/button';
import { LogOut, User, Heart, MessageCircle, Crown } from 'lucide-react';

const MainApp = () => {
  const { user, signOut } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [currentTab, setCurrentTab] = useState('discover');

  useEffect(() => {
    if (user) {
      checkProfile();
    }
  }, [user]);

  const checkProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user?.id)
        .single();

      setHasProfile(!!data && !error);
    } catch (error) {
      console.error('Error checking profile:', error);
      setHasProfile(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (hasProfile === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!hasProfile) {
    return <ProfileSetup />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
              💖 MatchTime
            </h1>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {currentTab === 'discover' && <DiscoverPage />}
        {currentTab === 'subscription' && <SubscriptionPage />}
        {/* Other tabs will be implemented later */}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex justify-around py-2">
          <Button
            variant={currentTab === 'discover' ? 'default' : 'ghost'}
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => setCurrentTab('discover')}
          >
            <Heart size={20} />
            <span className="text-xs">Discover</span>
          </Button>
          
          <Button
            variant={currentTab === 'matches' ? 'default' : 'ghost'}
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => setCurrentTab('matches')}
          >
            <MessageCircle size={20} />
            <span className="text-xs">Matches</span>
          </Button>

          <Button
            variant={currentTab === 'subscription' ? 'default' : 'ghost'}
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => setCurrentTab('subscription')}
          >
            <Crown size={20} />
            <span className="text-xs">Premium</span>
          </Button>
          
          <Button
            variant={currentTab === 'profile' ? 'default' : 'ghost'}
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => setCurrentTab('profile')}
          >
            <User size={20} />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default MainApp;
