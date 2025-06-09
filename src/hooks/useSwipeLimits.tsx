
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSwipeLimits = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const [remainingSwipes, setRemainingSwipes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkRemainingSwipes();
    }
  }, [user, subscription.tier]);

  const checkRemainingSwipes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('check_daily_swipe_limit', {
        user_uuid: user?.id
      });

      if (error) {
        console.error('Error checking swipe limit:', error);
        return;
      }

      setRemainingSwipes(data || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canSwipe = (): boolean => {
    // Premium users have unlimited swipes
    if (subscription.tier !== 'free') {
      return true;
    }
    
    return remainingSwipes > 0;
  };

  const consumeSwipe = async (): Promise<boolean> => {
    if (!canSwipe()) {
      toast({
        title: "Daily Limit Reached",
        description: "Upgrade to premium for unlimited swipes!",
        variant: "destructive",
      });
      return false;
    }

    try {
      await supabase.rpc('increment_swipe_count', { user_uuid: user?.id });
      
      // Only decrement for free users
      if (subscription.tier === 'free') {
        setRemainingSwipes(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (error) {
      console.error('Error consuming swipe:', error);
      return false;
    }
  };

  const isPremium = subscription.tier !== 'free';

  return {
    remainingSwipes: isPremium ? 999 : remainingSwipes,
    canSwipe,
    consumeSwipe,
    isLoading,
    isPremium,
    refreshLimits: checkRemainingSwipes
  };
};
