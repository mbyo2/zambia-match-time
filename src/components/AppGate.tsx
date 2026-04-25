import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import OnboardingFlow from './onboarding/OnboardingFlow';
import ProfileSetup from './profile/ProfileSetup';
import AuthForm from './auth/AuthForm';

const AppGate = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) checkProfile();
  }, [user]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return <AuthForm />;

  if (hasProfile === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setShowOnboarding(false);
          setHasProfile(true);
        }}
      />
    );
  }

  if (!hasProfile) return <ProfileSetup />;

  // Default to /app/discover when navigating to /app
  if (location.pathname === '/app' || location.pathname === '/app/') {
    return <Navigate to="/app/discover" replace />;
  }

  return <Outlet />;
};

export default AppGate;
