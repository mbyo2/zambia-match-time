import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useTypingIndicator = (conversationId: string, otherUserName: string) => {
  const { user } = useAuth();
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to typing indicators
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingUsers = Object.values(state).flat().filter((presence: any) => 
          presence.user_id !== user?.id && presence.is_typing
        );
        setIsOtherUserTyping(typingUsers.length > 0);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const typingUser = newPresences.find((presence: any) => 
          presence.user_id !== user?.id && presence.is_typing
        );
        if (typingUser) setIsOtherUserTyping(true);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const wasTypingUser = leftPresences.find((presence: any) => 
          presence.user_id !== user?.id
        );
        if (wasTypingUser) setIsOtherUserTyping(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id]);

  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!user || !conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    
    if (isTyping) {
      await channel.track({
        user_id: user.id,
        is_typing: true,
        timestamp: new Date().toISOString()
      });

      // Clear any existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Set timeout to stop typing indicator after 3 seconds
      const timeout = setTimeout(() => {
        channel.track({
          user_id: user.id,
          is_typing: false
        });
      }, 3000);

      setTypingTimeout(timeout);
    } else {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      
      await channel.track({
        user_id: user.id,
        is_typing: false
      });
    }
  }, [user, conversationId, typingTimeout]);

  return {
    isOtherUserTyping,
    sendTypingIndicator
  };
};