
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ProfileSetup from './profile/ProfileSetup';
import ProfileEditPage from './profile/ProfileEditPage';
import DiscoverPage from './discover/DiscoverPage';
import MatchesPage from './matches/MatchesPage';
import AccommodationsPage from './accommodations/AccommodationsPage';
import SubscriptionPage from './subscription/SubscriptionPage';
import SecuritySettings from './security/SecuritySettings';
import ContentModerationManager from './safety/ContentModerationManager';
import VerificationManager from './safety/VerificationManager';
import PrivacyPolicy from './legal/PrivacyPolicy';
import TermsOfService from './legal/TermsOfService';
import NotificationCenter from './notifications/NotificationCenter';
import OnboardingFlow from './onboarding/OnboardingFlow';
import { Button } from '@/components/ui/button';
import { LogOut, User, Heart, MessageCircle, Crown, Shield, FileText, CheckCircle, CalendarDays, Building } from 'lucide-react';
import ProfilePage from './profile/ProfilePage';
import SubPageWrapper from './SubPageWrapper';
import { useNotifications } from '@/services/notificationService';
import SafetyCenter from './safety/SafetyCenter';
import CommunityGuidelines from './legal/CommunityGuidelines';
import DevActions from './admin/DevActions';

const MainApp = () => {
  const { user, signOut } = useAuth();
  const { initNotifications, subscribeToNotifications } = useNotifications();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentTab, setCurrentTab] = useState('discover');

  useEffect(() => {
    if (user) {
      checkProfile();
      setupNotifications();
    }
  }, [user]);

  const checkProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name')
        .eq('id', user?.id)
        .single();

      const profileExists = !!data && !error;
      setHasProfile(profileExists);
      
      // Show onboarding for new users
      if (!profileExists) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      setHasProfile(false);
      setShowOnboarding(true);
    }
  };

  const setupNotifications = async () => {
    try {
      const granted = await initNotifications();
      if (granted && user) {
        await subscribeToNotifications(user.id);
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Profile setup will be shown next
  };

  if (hasProfile === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  if (!hasProfile) {
    return <ProfileSetup />;
  }

  const subPages: Record<string, { title: string; component: React.ReactNode }> = {
    security: { title: 'Security Settings', component: <SecuritySettings /> },
    moderation: { title: 'Content Moderation', component: <ContentModerationManager /> },
    verification: { title: 'Profile Verification', component: <VerificationManager /> },
    privacy: { title: 'Privacy Policy', component: <PrivacyPolicy /> },
    terms: { title: 'Terms of Service', component: <TermsOfService /> },
    safety: { title: 'Safety Center', component: <SafetyCenter /> },
    guidelines: { title: 'Community Guidelines', component: <CommunityGuidelines /> },
    admin: { title: 'Admin Panel', component: <DevActions /> },
  };

  if (subPages[currentTab]) {
    const { title, component } = subPages[currentTab];
    return (
      <SubPageWrapper title={title} onBack={() => setCurrentTab('profile')}>
        {component}
      </SubPageWrapper>
    );
  }

  if (currentTab === 'profile-edit') {
    return <ProfileEditPage onBack={() => setCurrentTab('profile')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">
              JustGrown
            </h1>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {currentTab === 'discover' && <DiscoverPage />}
        {currentTab === 'matches' && <MatchesPage />}
        {currentTab === 'accommodations' && <AccommodationsPage />}
        {currentTab === 'subscription' && <SubscriptionPage />}
        {currentTab === 'profile' && <ProfilePage setCurrentTab={setCurrentTab} />}
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
            variant={currentTab === 'accommodations' ? 'default' : 'ghost'}
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => setCurrentTab('accommodations')}
          >
            <Building size={20} />
            <span className="text-xs">Stays</span>
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
