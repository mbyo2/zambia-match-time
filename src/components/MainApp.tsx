import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import ProfileSetup from './profile/ProfileSetup';
import ProfileEditPage from './profile/ProfileEditPage';
import DiscoverPage from './discover/DiscoverPage';
import MatchesPage from './matches/MatchesPage';
import AccommodationsPage from './accommodations/AccommodationsPage';
import SecuritySettings from './security/SecuritySettings';
import ContentModerationManager from './safety/ContentModerationManager';
import VerificationManager from './safety/VerificationManager';
import PrivacyPolicy from './legal/PrivacyPolicy';
import TermsOfService from './legal/TermsOfService';
import OnboardingFlow from './onboarding/OnboardingFlow';
import ProfilePage from './profile/ProfilePage';
import SubPageWrapper from './SubPageWrapper';
import SafetyCenter from './safety/SafetyCenter';
import CommunityGuidelines from './legal/CommunityGuidelines';
import DevActions from './admin/DevActions';
import SubscriptionPage from './subscription/SubscriptionPage';
import ErrorBoundary from './ErrorBoundary';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Flame, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProfileViews from './social/ProfileViews';

const MainApp = () => {
  const { user, signOut } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentTab, setCurrentTab] = useState('discover');
  const { isSuperAdmin } = useSuperAdmin();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      checkProfile();
      fetchUnreadCount();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('unread-messages-badge')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => { fetchUnreadCount(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (currentTab === 'matches') {
      const t = setTimeout(() => setUnreadCount(0), 1500);
      return () => clearTimeout(t);
    }
  }, [currentTab]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (!error && count !== null) setUnreadCount(count);
    } catch (e) {
      // silent fail
    }
  };

  const checkProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, date_of_birth, gender')
        .eq('id', user?.id)
        .single();

      if (!data || error) {
        setHasProfile(false);
        setShowOnboarding(true);
        return;
      }

      const isComplete = data.first_name && data.first_name !== 'New' && data.date_of_birth && data.gender;
      setHasProfile(!!isComplete);
      if (!isComplete) setShowOnboarding(true);
    } catch (error) {
      logger.error('Error checking profile:', error);
      setHasProfile(false);
      setShowOnboarding(true);
    }
  };

  // Navigate to matches tab (used by match celebration)
  const navigateToMatches = () => {
    setCurrentTab('matches');
  };

  if (hasProfile === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => {
      setShowOnboarding(false);
      setHasProfile(true);
    }} />;
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
    subscription: { title: 'Subscription', component: <SubscriptionPage /> },
    'manage-venues': { title: 'Manage Venues', component: <AccommodationsPage /> },
    'profile-views': { title: 'Profile Views', component: <ProfileViews /> },
  };

  if (currentTab === 'admin' && !isSuperAdmin) {
    return (
      <SubPageWrapper title="Access Denied" onBack={() => setCurrentTab('profile')}>
        <div className="p-4 text-muted-foreground">You do not have permission to view this page.</div>
      </SubPageWrapper>
    );
  }

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

  const tabs = [
    { id: 'discover', icon: Flame, label: 'Discover' },
    { id: 'matches', icon: MessageCircle, label: 'Matches' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-16 overflow-hidden">
        <ErrorBoundary>
          {currentTab === 'discover' && <DiscoverPage onNavigateToMatches={navigateToMatches} />}
          {currentTab === 'matches' && <MatchesPage />}
          {currentTab === 'profile' && <ProfilePage setCurrentTab={setCurrentTab} />}
        </ErrorBoundary>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50">
        <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
          {tabs.map(({ id, icon: Icon, label }) => {
            const isActive = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentTab(id)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                aria-label={label}
              >
                <Icon className={cn("h-6 w-6", isActive && id === 'discover' && "fill-primary")} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
                {id === 'matches' && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MainApp;
