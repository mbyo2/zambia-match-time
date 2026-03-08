import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  is_read: boolean;
  message_type: 'text' | 'image' | 'voice' | 'video';
  media_url?: string | null;
}

interface RealtimeMessagesProps {
  conversationId: string;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string) => void;
  onMessageUpdate?: (message: Message) => void;
  onTypingChange?: (isTyping: boolean, userId: string) => void;
  onUserOnlineChange?: (isOnline: boolean, userId: string) => void;
}

const RealtimeMessages = ({ 
  conversationId, 
  onNewMessage, 
  onMessageRead, 
  onMessageUpdate,
  onTypingChange,
  onUserOnlineChange
}: RealtimeMessagesProps) => {
  const { user } = useAuth();
  
  // Use refs to avoid stale closures in subscription callbacks
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageReadRef = useRef(onMessageRead);
  const onMessageUpdateRef = useRef(onMessageUpdate);
  const onTypingChangeRef = useRef(onTypingChange);
  const onUserOnlineChangeRef = useRef(onUserOnlineChange);

  useEffect(() => { onNewMessageRef.current = onNewMessage; }, [onNewMessage]);
  useEffect(() => { onMessageReadRef.current = onMessageRead; }, [onMessageRead]);
  useEffect(() => { onMessageUpdateRef.current = onMessageUpdate; }, [onMessageUpdate]);
  useEffect(() => { onTypingChangeRef.current = onTypingChange; }, [onTypingChange]);
  useEffect(() => { onUserOnlineChangeRef.current = onUserOnlineChange; }, [onUserOnlineChange]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const messagesChannel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          onNewMessageRef.current?.(payload.new as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          onMessageUpdateRef.current?.(updatedMessage);
          if (updatedMessage.is_read) {
            onMessageReadRef.current?.(updatedMessage.id);
          }
        }
      )
      .subscribe();

    const typingChannel = supabase
      .channel(`typing-${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id !== user.id) {
              onTypingChangeRef.current?.(presence.typing || false, presence.user_id);
            }
          });
        });
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.user_id !== user.id) {
            onTypingChangeRef.current?.(presence.typing || false, presence.user_id);
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          if (presence.user_id !== user.id) {
            onTypingChangeRef.current?.(false, presence.user_id);
          }
        });
      })
      .subscribe();

    const presenceChannel = supabase
      .channel(`presence-${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id !== user.id) {
              onUserOnlineChangeRef.current?.(true, presence.user_id);
            }
          });
        });
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.user_id !== user.id) {
            onUserOnlineChangeRef.current?.(true, presence.user_id);
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          if (presence.user_id !== user.id) {
            onUserOnlineChangeRef.current?.(false, presence.user_id);
          }
        });
      })
      .subscribe();

    presenceChannel.track({
      user_id: user.id,
      online_at: new Date().toISOString()
    });

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [conversationId, user?.id]);

  return null;
};

export default RealtimeMessages;
