
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MessageInput from '@/components/messaging/MessageInput';
import TypingIndicator from '@/components/messaging/TypingIndicator';
import MessageReactions from '@/components/messaging/MessageReactions';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  message_type: 'text' | 'image' | 'voice' | 'video';
  reactions?: { emoji: string; count: number; userReacted: boolean }[];
}

interface ChatViewProps {
  match: any;
  onBack: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ match, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (match?.conversation?.id) {
      fetchMessages();
      subscribeToMessages();
      subscribeToTypingIndicators();
    }
  }, [match]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', match.conversation.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
      markMessagesAsRead();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', match.conversation.id)
        .neq('sender_id', user?.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${match.conversation.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          
          // Mark new messages as read if they're not from current user
          if (payload.new.sender_id !== user?.id) {
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToTypingIndicators = () => {
    const channel = supabase
      .channel(`typing_${match.conversation.id}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherUsersTyping = Object.values(state).some((presences: any) => 
          presences.some((presence: any) => 
            presence.user_id !== user?.id && presence.typing
          )
        );
        setOtherUserTyping(otherUsersTyping);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (content: string, messageType: 'text' | 'image' = 'text') => {
    if (!content.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: match.conversation.id,
          sender_id: user.id,
          content: content.trim(),
          message_type: messageType
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        return;
      }

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', match.conversation.id);

    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleTyping = (typing: boolean) => {
    setIsTyping(typing);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator via presence
    const channel = supabase.channel(`typing_${match.conversation.id}`);
    channel.track({ user_id: user?.id, typing });

    if (typing) {
      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        channel.track({ user_id: user?.id, typing: false });
      }, 3000);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    // This would need a message_reactions table in a real implementation
    toast({
      title: "Feature coming soon!",
      description: "Message reactions will be available in the next update.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
            {match.other_user.profile_photos?.find((p: any) => p.is_primary) ? (
              <img
                src={match.other_user.profile_photos.find((p: any) => p.is_primary)?.photo_url}
                alt={match.other_user.first_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                {match.other_user.first_name[0]}
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-lg font-semibold">{match.other_user.first_name}</h1>
            {otherUserTyping && (
              <span className="text-xs text-green-500">typing...</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Start the conversation! 👋</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-xs lg:max-w-md">
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.sender_id === user?.id
                      ? 'bg-pink-500 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs ${
                      message.sender_id === user?.id ? 'text-pink-100' : 'text-gray-400'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {message.sender_id === user?.id && (
                      <span className={`text-xs ${
                        message.is_read ? 'text-pink-200' : 'text-pink-300'
                      }`}>
                        {message.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Message reactions */}
                <div className="mt-1">
                  <MessageReactions
                    messageId={message.id}
                    reactions={message.reactions}
                    onReact={handleReaction}
                  />
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        <TypingIndicator 
          userName={match.other_user.first_name}
          isVisible={otherUserTyping}
        />
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={sendMessage}
        onTyping={handleTyping}
        disabled={false}
      />
    </div>
  );
};

export default ChatView;
