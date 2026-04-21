
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTierFeatures } from '@/hooks/useTierFeatures';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSwipeLimits = () => {
  const { user } = useAuth();
  const { dailySwipes, isPaid } = useTierFeatures();
  const { toast } = useToast();
  const [remainingSwipes, setRemainingSwipes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkRemainingSwipes();
    }
  }, [user, dailySwipes]);

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
    // -1 means unlimited
    if (dailySwipes === -1) return true;
    return remainingSwipes > 0;
  };

  const consumeSwipe = async (): Promise<boolean> => {
    if (!canSwipe()) {
      toast({
        title: "Daily Limit Reached",
        description: "Upgrade to Basic or higher for unlimited swipes!",
        variant: "destructive",
      });
      return false;
    }

    try {
      await supabase.rpc('increment_swipe_count', { user_uuid: user?.id });
      
      // Only decrement when user has a finite limit
      if (dailySwipes !== -1) {
        setRemainingSwipes(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (error) {
      console.error('Error consuming swipe:', error);
      return false;
    }
  };

  const isPremium = isPaid;

  return {
    remainingSwipes: dailySwipes === -1 ? 999 : remainingSwipes,
    canSwipe,
    consumeSwipe,
    isLoading,
    isPremium,
    refreshLimits: checkRemainingSwipes
  };
};
