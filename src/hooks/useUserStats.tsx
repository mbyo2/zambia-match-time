
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserStats {
  id: string;
  level: number;
  experience_points: number;
  login_streak: number;
  total_matches: number;
  total_conversations: number;
  profile_views: number;
  likes_given: number;
  likes_received: number;
  super_likes_given: number;
  super_likes_received: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  points_reward: number;
  earned_at?: string;
}

export const useUserStats = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchUserAchievements();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user stats:', error);
        return;
      }

      if (data) {
        setStats(data);
      } else {
        // Create initial stats
        const { data: newStats, error: createError } = await supabase
          .from('user_stats')
          .insert({ user_id: user?.id })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user stats:', createError);
        } else {
          setStats(newStats);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserStats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          earned_at,
          achievements:achievement_id (
            id,
            name,
            description,
            icon,
            requirement_type,
            requirement_value,
            points_reward
          )
        `)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching achievements:', error);
        return;
      }

      const achievementsWithDate = data?.map(item => ({
        ...item.achievements,
        earned_at: item.earned_at
      })) || [];

      setAchievements(achievementsWithDate);
    } catch (error) {
      console.error('Error in fetchUserAchievements:', error);
    }
  };

  const updateStats = async (updates: Partial<UserStats>) => {
    if (!user || !stats) return;

    try {
      const { error } = await supabase
        .from('user_stats')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating stats:', error);
        return;
      }

      setStats(prev => prev ? { ...prev, ...updates } : null);

      // Check for new achievements
      await checkAchievements();
    } catch (error) {
      console.error('Error in updateStats:', error);
    }
  };

  const checkAchievements = async () => {
    if (!user) return;

    try {
      await supabase.rpc('check_achievements', { p_user_id: user.id });
      
      // Refresh achievements to see if any new ones were earned
      await fetchUserAchievements();
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const incrementStat = async (statName: keyof UserStats, amount: number = 1) => {
    if (!stats) return;
    
    const currentValue = stats[statName] as number;
    await updateStats({ [statName]: currentValue + amount });
  };

  return {
    stats,
    achievements,
    loading,
    updateStats,
    incrementStat,
    refreshStats: fetchUserStats
  };
};
