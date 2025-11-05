import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  is_read: boolean;
  message_type: 'text' | 'image' | 'voice' | 'video';
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
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!conversationId || !user) return;

    // Subscribe to real-time message updates
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
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          onNewMessage?.(newMessage);
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
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          ));
          onMessageUpdate?.(updatedMessage);
          if (updatedMessage.is_read) {
            onMessageRead?.(updatedMessage.id);
          }
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`typing-${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState();
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id !== user.id) {
              onTypingChange?.(presence.typing || false, presence.user_id);
            }
          });
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.user_id !== user.id) {
            onTypingChange?.(presence.typing || false, presence.user_id);
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          if (presence.user_id !== user.id) {
            onTypingChange?.(false, presence.user_id);
          }
        });
      })
      .subscribe();

    // Subscribe to user presence/online status
    const presenceChannel = supabase
      .channel(`presence-${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id !== user.id) {
              onUserOnlineChange?.(true, presence.user_id);
            }
          });
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.user_id !== user.id) {
            onUserOnlineChange?.(true, presence.user_id);
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          if (presence.user_id !== user.id) {
            onUserOnlineChange?.(false, presence.user_id);
          }
        });
      })
      .subscribe();

    // Track our own presence
    presenceChannel.track({
      user_id: user.id,
      online_at: new Date().toISOString()
    });

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [conversationId, user, onNewMessage, onMessageRead, onMessageUpdate, onTypingChange, onUserOnlineChange]);

  // Mark messages as read when they come into view
  useEffect(() => {
    const markAsRead = async () => {
      const unreadMessages = messages.filter(msg => 
        !msg.is_read && msg.sender_id !== user?.id
      );

      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg.id);
        
        await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', messageIds);
      }
    };

    markAsRead();
  }, [messages, user?.id]);

  // Function to send typing indicator
  const sendTypingIndicator = (isTyping: boolean) => {
    const typingChannel = supabase.channel(`typing-${conversationId}`);
    typingChannel.track({
      user_id: user?.id,
      typing: isTyping
    });
  };

  return null; // This is a utility component that doesn't render anything
};

export default RealtimeMessages;
