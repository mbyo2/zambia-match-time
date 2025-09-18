import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RateLimitResult {
  success: boolean;
  blocked: boolean;
  remainingAttempts?: number;
}

export const useRateLimit = () => {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkRateLimit = async (
    actionType: string,
    maxAttempts: number = 10,
    windowMinutes: number = 60
  ): Promise<RateLimitResult> => {
    try {
      setIsChecking(true);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, blocked: false };
      }

      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: user.user.id,
        p_action_type: actionType,
        p_max_attempts: maxAttempts,
        p_window_minutes: windowMinutes
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return { success: true, blocked: false }; // Fail open for better UX
      }

      if (!data) {
        toast({
          title: "Rate limit exceeded",
          description: `Too many ${actionType} attempts. Please wait before trying again.`,
          variant: "destructive",
        });
        return { success: false, blocked: true };
      }

      return { success: true, blocked: false };
    } catch (error) {
      console.error('Rate limit error:', error);
      return { success: true, blocked: false }; // Fail open
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkRateLimit,
    isChecking
  };
};