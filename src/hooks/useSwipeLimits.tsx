
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
    try {
      const { data, error } = await supabase.rpc('consume_swipe' as any);
      if (error) {
        console.error('Error consuming swipe:', error);
        return false;
      }
      const result = (data ?? {}) as { allowed?: boolean; reason?: string; remaining?: number };
      if (!result.allowed) {
        toast({
          title: result.reason === 'daily_limit_reached' ? 'Daily Limit Reached' : 'Action Not Allowed',
          description: result.reason === 'daily_limit_reached'
            ? 'Upgrade to Basic or higher for unlimited swipes!'
            : 'You are not allowed to perform this action.',
          variant: 'destructive',
        });
        if (typeof result.remaining === 'number' && result.remaining >= 0) {
          setRemainingSwipes(result.remaining);
        }
        return false;
      }
      if (typeof result.remaining === 'number' && result.remaining >= 0) {
        setRemainingSwipes(result.remaining);
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
