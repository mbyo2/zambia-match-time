import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface RateLimitState {
  isLimited: boolean;
  remainingQueries: number;
  resetTime: Date | null;
}

export const useDiscoveryRateLimit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isLimited: false,
    remainingQueries: 30,
    resetTime: null
  });

  const checkRateLimit = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('check_discovery_rate_limit', {
        p_user_id: user.id
      });

      if (error) {
        logger.error('Rate limit check failed:', error);
        return true; // Allow on error to prevent blocking users
      }

      const canProceed = data as boolean;

      if (!canProceed) {
        const resetTime = new Date();
        resetTime.setMinutes(resetTime.getMinutes() + 5);
        
        setRateLimitState({
          isLimited: true,
          remainingQueries: 0,
          resetTime
        });

        toast({
          title: "Rate Limit Reached",
          description: "Please wait a few minutes before searching again. This protects user privacy.",
          variant: "destructive",
        });

        return false;
      }

      // Update remaining queries estimate
      const { count: recentCount } = await supabase
        .from('security_audit_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'discovery_profiles_accessed')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      const remaining = Math.max(0, 30 - (recentCount || 0));
      
      setRateLimitState({
        isLimited: false,
        remainingQueries: remaining,
        resetTime: remaining === 0 ? new Date(Date.now() + 5 * 60 * 1000) : null
      });

      return true;
    } catch (error) {
      logger.error('Error checking rate limit:', error);
      return true; // Allow on error
    }
  }, [user?.id, toast]);

  return {
    checkRateLimit,
    rateLimitState,
  };
};
