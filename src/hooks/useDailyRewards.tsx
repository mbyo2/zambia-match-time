
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DailyReward {
  id: string;
  reward_type: string;
  reward_value: number;
  claimed: boolean;
  reward_date: string;
}

export const useDailyRewards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayReward, setTodayReward] = useState<DailyReward | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkDailyReward();
    }
  }, [user]);

  const checkDailyReward = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('user_id', user?.id)
        .eq('reward_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error checking daily reward:', error);
        return;
      }

      if (!data) {
        // Create today's reward
        const rewardTypes = ['super_like', 'boost', 'points'];
        const randomType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
        const rewardValue = randomType === 'points' ? 50 : 1;

        const { data: newReward, error: createError } = await supabase
          .from('daily_rewards')
          .insert({
            user_id: user?.id,
            reward_type: randomType,
            reward_value: rewardValue,
            reward_date: today
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating daily reward:', createError);
        } else {
          setTodayReward(newReward);
        }
      } else {
        setTodayReward(data);
      }
    } catch (error) {
      console.error('Error in checkDailyReward:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimDailyReward = async () => {
    if (!todayReward || todayReward.claimed) return;

    try {
      const { error } = await supabase
        .from('daily_rewards')
        .update({ claimed: true })
        .eq('id', todayReward.id);

      if (error) {
        console.error('Error claiming reward:', error);
        return;
      }

      setTodayReward(prev => prev ? { ...prev, claimed: true } : null);

      toast({
        title: "Daily Reward Claimed! 🎉",
        description: `You received ${todayReward.reward_value} ${todayReward.reward_type}${todayReward.reward_value > 1 ? 's' : ''}!`,
      });

      return true;
    } catch (error) {
      console.error('Error in claimDailyReward:', error);
      return false;
    }
  };

  return {
    todayReward,
    loading,
    claimDailyReward,
    refreshReward: checkDailyReward
  };
};
