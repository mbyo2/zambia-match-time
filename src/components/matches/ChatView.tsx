import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MessageInput, { type SendPayload, type ReplyContext } from '@/components/messaging/MessageInput';
import RealtimeMessages from '@/components/messaging/RealtimeMessages';
import LiveMessageIndicator from '@/components/messaging/LiveMessageIndicator';
import ChatBubble, { type BubbleMessage } from '@/components/messaging/ChatBubble';
import VenueSuggestions from '@/components/venues/VenueSuggestions';
import ActivityStatus from '@/components/social/ActivityStatus';
import { logger } from '@/utils/logger';
import { formatDaySeparator, sameDay } from '@/utils/chatTime';

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  message_type: 'text' | 'image' | 'voice' | 'video';
  media_url?: string | null;
  duration_seconds?: number | null;
  reply_to_id?: string | null;
  reactions?: Reaction[];
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
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [replyTo, setReplyTo] = useState<BubbleMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (match?.conversation?.id) {
      fetchMessages();
    }
  }, [match]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setNewMessageCount(0);
  }, [messages.length]);

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
        logger.error('Error fetching messages:', error);
        return;
      }

      // Fetch reactions for these messages
      const messageIds = (data || []).map(m => m.id);
      let reactionsMap: Record<string, Reaction[]> = {};

      if (messageIds.length > 0) {
        const { data: reactionsData } = await supabase
          .from('message_reactions')
          .select('message_id, emoji, user_id')
          .in('message_id', messageIds);

        if (reactionsData) {
          reactionsData.forEach(r => {
            if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = [];
            const existing = reactionsMap[r.message_id].find(e => e.emoji === r.emoji);
            if (existing) {
              existing.count++;
              if (r.user_id === user?.id) existing.userReacted = true;
            } else {
              reactionsMap[r.message_id].push({
                emoji: r.emoji,
                count: 1,
                userReacted: r.user_id === user?.id,
              });
            }
          });
        }
      }

      const messagesWithReactions = (data || []).map(m => ({
        ...m,
        reactions: reactionsMap[m.id] || [],
      }));

      setMessages(messagesWithReactions);
      markMessagesAsRead();
    } catch (error) {
      logger.error('Error:', error);
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
      logger.error('Error marking messages as read:', error);
    }
  };

  const handleNewMessage = (message: Message) => {
    setMessages(prev => {
      if (prev.some(msg => msg.id === message.id)) return prev;
      return [...prev, { ...message, reactions: [] }];
    });
    if (message.sender_id !== user?.id) {
      setNewMessageCount(prev => prev + 1);
      setTimeout(() => markMessagesAsRead(), 1000);
    }
  };

  const handleMessageUpdate = (message: Message) => {
    setMessages(prev => prev.map(msg =>
      msg.id === message.id ? { ...msg, ...message } : msg
    ));
  };

  const handleTypingChange = (typing: boolean, userId: string) => {
    if (userId !== user?.id) setOtherUserTyping(typing);
  };

  const handleUserOnlineChange = (online: boolean, userId: string) => {
    if (userId !== user?.id) setOtherUserOnline(online);
  };

  const sendMessage = async (payload: SendPayload) => {
    if (!user) return;
    try {
      const insertData: any = {
        conversation_id: match.conversation.id,
        sender_id: user.id,
        message_type: payload.type,
        reply_to_id: payload.replyToId ?? null,
      };
      if (payload.type === 'text') {
        insertData.content = payload.content;
      } else if (payload.type === 'image') {
        insertData.media_url = payload.mediaUrl;
      } else if (payload.type === 'voice') {
        insertData.media_url = payload.mediaUrl;
        insertData.duration_seconds = payload.durationSeconds;
      }

      const { error } = await supabase.from('messages').insert(insertData);
      if (error) {
        logger.error('Error sending message:', error);
        toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
        return;
      }

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', match.conversation.id);

      setReplyTo(null);
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const handleTyping = (typing: boolean) => {
    setIsTyping(typing);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const typingChannel = supabase.channel(`typing-${match.conversation.id}`);
    typingChannel.track({
      user_id: user?.id,
      typing: typing,
      timestamp: new Date().toISOString()
    });

    if (typing) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        typingChannel.track({ user_id: user?.id, typing: false });
      }, 3000);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Check if reaction already exists
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        // Remove reaction (toggle off)
        await supabase.from('message_reactions').delete().eq('id', existing.id);
        setMessages(prev => prev.map(msg => {
          if (msg.id !== messageId) return msg;
          const reactions = (msg.reactions || []).map(r => {
            if (r.emoji !== emoji) return r;
            return { ...r, count: r.count - 1, userReacted: false };
          }).filter(r => r.count > 0);
          return { ...msg, reactions };
        }));
      } else {
        // Add reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert({ message_id: messageId, user_id: user.id, emoji });

        if (error) throw error;

        setMessages(prev => prev.map(msg => {
          if (msg.id !== messageId) return msg;
          const reactions = [...(msg.reactions || [])];
          const existing = reactions.find(r => r.emoji === emoji);
          if (existing) {
            existing.count++;
            existing.userReacted = true;
          } else {
            reactions.push({ emoji, count: 1, userReacted: true });
          }
          return { ...msg, reactions };
        }));
      }
    } catch (error) {
      logger.error('Error toggling reaction:', error);
      toast({ title: "Error", description: "Failed to react", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const otherFirstName = match.other_user.first_name as string;
  const senderName = (sid: string) => (sid === user?.id ? 'You' : otherFirstName);

  const replyContext: ReplyContext | null = replyTo
    ? {
        id: replyTo.id,
        senderName: senderName(replyTo.sender_id),
        preview:
          replyTo.message_type === 'image' ? '📷 Photo'
          : replyTo.message_type === 'voice' ? '🎤 Voice message'
          : (replyTo.content || ''),
      }
    : null;

  const jumpTo = (id: string) => {
    const el = messageRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 1200);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <RealtimeMessages
        conversationId={match.conversation.id}
        onNewMessage={handleNewMessage}
        onMessageUpdate={handleMessageUpdate}
        onTypingChange={handleTypingChange}
        onUserOnlineChange={handleUserOnlineChange}
      />

      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>

          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
            {(() => {
              const primary = match.other_user.profile_photos?.find((p: any) => p.is_primary);
              const fallback = match.other_user.profile_photos?.[0];
              const avatarUrl = primary?.photo_url || fallback?.photo_url || '/placeholder.svg';
              return (
                <img src={avatarUrl} alt={match.other_user.first_name} className="w-full h-full object-cover" />
              );
            })()}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{match.other_user.first_name}</h1>
              {match.other_user.has_accommodation_available && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  🏠 Has venue
                </span>
              )}
            </div>
            {otherUserTyping ? (
              <LiveMessageIndicator isOnline={otherUserOnline} isTyping={otherUserTyping} userName={match.other_user.first_name} />
            ) : (
              <ActivityStatus userId={match.other_user.id} lastActive={match.other_user.last_active} />
            )}
          </div>

          {newMessageCount > 0 && (
            <div className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
              {newMessageCount} new
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1 bg-chat-surface">
        {messages.length === 0 ? (
          <div className="text-center space-y-6 mt-8">
            <p className="text-muted-foreground">Start the conversation! 👋</p>
            {match.other_user.has_accommodation_available && (
              <div className="mx-auto max-w-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">🏠 {match.other_user.first_name} has a venue available!</p>
                <p className="text-muted-foreground text-xs mt-1">They can host — ask about their place for a date!</p>
              </div>
            )}
            <VenueSuggestions />
          </div>
        ) : (
          messages.map((message, idx) => {
            const prev = messages[idx - 1];
            const next = messages[idx + 1];
            const isOutgoing = message.sender_id === user?.id;
            const showDaySeparator = !prev || !sameDay(prev.created_at, message.created_at);
            // tail when next message is from different sender or is far apart in time
            const showTail = !next
              || next.sender_id !== message.sender_id
              || (new Date(next.created_at).getTime() - new Date(message.created_at).getTime()) > 60_000;

            const repliedTo = message.reply_to_id
              ? messages.find(m => m.id === message.reply_to_id) ?? null
              : null;

            return (
              <React.Fragment key={message.id}>
                {showDaySeparator && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] uppercase tracking-wide bg-card border border-border text-muted-foreground rounded-full px-3 py-1 shadow-sm">
                      {formatDaySeparator(message.created_at)}
                    </span>
                  </div>
                )}
                <div
                  ref={(el) => { messageRefs.current[message.id] = el; }}
                  className="transition-shadow rounded-2xl"
                >
                  <ChatBubble
                    message={message as BubbleMessage}
                    isOutgoing={isOutgoing}
                    showTail={showTail}
                    repliedTo={repliedTo as BubbleMessage | null}
                    repliedToSenderName={repliedTo ? senderName(repliedTo.sender_id) : undefined}
                    onReply={(m) => setReplyTo(m)}
                    onReact={handleReaction}
                    onJumpTo={jumpTo}
                  />
                </div>
              </React.Fragment>
            );
          })
        )}

        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-card border border-border shadow-sm px-4 py-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSend={sendMessage}
        onTyping={handleTyping}
        disabled={false}
        conversationId={match.conversation.id}
        userId={user?.id}
        replyContext={replyContext}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
};

export default ChatView;
