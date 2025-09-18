import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserStatus {
  user_id: string;
  is_online: boolean;
  last_seen: string;
}

export const useOnlineStatus = (conversationId?: string) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserStatus>>(new Map());

  useEffect(() => {
    if (!user) return;

    // Update user's online status
    const updateOnlineStatus = async (isOnline: boolean) => {
      try {
        await supabase
          .from('profiles')
          .update({ 
            last_active: new Date().toISOString()
          })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    // Set user as online when component mounts
    updateOnlineStatus(true);

    // Set up presence tracking for conversation
    let presenceChannel: any = null;
    
    if (conversationId) {
      presenceChannel = supabase
        .channel(`presence:${conversationId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const statusMap = new Map<string, UserStatus>();
          
          Object.values(state).flat().forEach((presence: any) => {
            statusMap.set(presence.user_id, {
              user_id: presence.user_id,
              is_online: true,
              last_seen: presence.timestamp
            });
          });
          
          setOnlineUsers(statusMap);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          setOnlineUsers(prev => {
            const updated = new Map(prev);
            newPresences.forEach((presence: any) => {
              updated.set(presence.user_id, {
                user_id: presence.user_id,
                is_online: true,
                last_seen: presence.timestamp
              });
            });
            return updated;
          });
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          setOnlineUsers(prev => {
            const updated = new Map(prev);
            leftPresences.forEach((presence: any) => {
              updated.set(presence.user_id, {
                user_id: presence.user_id,
                is_online: false,
                last_seen: new Date().toISOString()
              });
            });
            return updated;
          });
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: user.id,
              timestamp: new Date().toISOString(),
              online_at: new Date().toISOString()
            });
          }
        });
    }

    // Global presence tracking
    const globalChannel = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = globalChannel.presenceState();
        const statusMap = new Map<string, UserStatus>();
        
        Object.values(state).flat().forEach((presence: any) => {
          statusMap.set(presence.user_id, {
            user_id: presence.user_id,
            is_online: true,
            last_seen: presence.timestamp
          });
        });
        
        setOnlineUsers(prev => {
          const merged = new Map(prev);
          statusMap.forEach((status, userId) => {
            merged.set(userId, status);
          });
          return merged;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await globalChannel.track({
            user_id: user.id,
            timestamp: new Date().toISOString()
          });
        }
      });

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateOnlineStatus(false);
      } else {
        updateOnlineStatus(true);
      }
    };

    // Handle beforeunload to set offline status
    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Periodic online status update
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        updateOnlineStatus(true);
      }
    }, 30000); // Update every 30 seconds

    return () => {
      updateOnlineStatus(false);
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
      supabase.removeChannel(globalChannel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(intervalId);
    };
  }, [user, conversationId]);

  const isUserOnline = (userId: string): boolean => {
    const status = onlineUsers.get(userId);
    return status?.is_online || false;
  };

  const getUserLastSeen = (userId: string): string | null => {
    const status = onlineUsers.get(userId);
    return status?.last_seen || null;
  };

  return {
    onlineUsers,
    isUserOnline,
    getUserLastSeen
  };
};