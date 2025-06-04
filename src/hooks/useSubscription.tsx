
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  tier: 'free' | 'basic' | 'premium' | 'elite';
  status: string;
  currentPeriodEnd?: string;
  remainingSwipes: number;
  isLoading: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    tier: 'free',
    status: 'active',
    remainingSwipes: 50,
    isLoading: true,
  });

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      setSubscription(prev => ({ ...prev, isLoading: true }));

      // Get user subscription
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      // Get remaining swipes using the database function
      const { data: swipesData } = await supabase.rpc('check_daily_swipe_limit', {
        user_uuid: user?.id
      });

      setSubscription({
        tier: subData?.tier || 'free',
        status: subData?.status || 'active',
        currentPeriodEnd: subData?.current_period_end,
        remainingSwipes: swipesData || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(prev => ({ ...prev, isLoading: false }));
    }
  };

  const createCheckoutSession = async (priceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive",
      });
    }
  };

  const createPortalSession = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal",
        variant: "destructive",
      });
    }
  };

  const decrementSwipes = async () => {
    if (subscription.tier !== 'free') return true; // Unlimited for premium

    if (subscription.remainingSwipes <= 0) {
      toast({
        title: "Daily Limit Reached",
        description: "Upgrade to premium for unlimited swipes!",
        variant: "destructive",
      });
      return false;
    }

    try {
      await supabase.rpc('increment_swipe_count', { user_uuid: user?.id });
      setSubscription(prev => ({
        ...prev,
        remainingSwipes: Math.max(0, prev.remainingSwipes - 1)
      }));
      return true;
    } catch (error) {
      console.error('Error incrementing swipe count:', error);
      return false;
    }
  };

  return {
    subscription,
    createCheckoutSession,
    createPortalSession,
    decrementSwipes,
    refetchSubscription: fetchSubscriptionData,
  };
};
