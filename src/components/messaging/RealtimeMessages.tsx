
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  is_read: boolean;
}

interface RealtimeMessagesProps {
  conversationId: string;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string) => void;
}

const RealtimeMessages = ({ conversationId, onNewMessage, onMessageRead }: RealtimeMessagesProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!conversationId || !user) return;

    // Subscribe to real-time message updates
    const channel = supabase
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
          if (updatedMessage.is_read) {
            onMessageRead?.(updatedMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, onNewMessage, onMessageRead]);

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

  return null; // This is a utility component that doesn't render anything
};

export default RealtimeMessages;
