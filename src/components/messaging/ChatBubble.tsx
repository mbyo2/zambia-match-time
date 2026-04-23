import React, { useRef } from 'react';
import { Check, CheckCheck, Reply } from 'lucide-react';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import MessageReactions from './MessageReactions';

export interface BubbleMessage {
  id: string;
  content: string | null;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  message_type: 'text' | 'image' | 'voice' | 'video';
  media_url?: string | null;
  duration_seconds?: number | null;
  reply_to_id?: string | null;
  reactions?: { emoji: string; count: number; userReacted: boolean }[];
}

interface Props {
  message: BubbleMessage;
  isOutgoing: boolean;
  showTail: boolean;
  /** Provided so we can render a quoted reply preview inside the bubble. */
  repliedTo?: BubbleMessage | null;
  repliedToSenderName?: string;
  onReply: (m: BubbleMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  onJumpTo?: (messageId: string) => void;
}

const SWIPE_TRIGGER_PX = 60;

const ChatBubble: React.FC<Props> = ({
  message, isOutgoing, showTail, repliedTo, repliedToSenderName,
  onReply, onReact, onJumpTo,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const dragX = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    dragX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = e.touches[0].clientX - startX.current;
    // Only allow swipe-right for outgoing reply (mirror of WhatsApp); both directions allowed
    dragX.current = Math.max(-90, Math.min(90, dx));
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translateX(${dragX.current}px)`;
    }
  };
  const onTouchEnd = () => {
    if (Math.abs(dragX.current) > SWIPE_TRIGGER_PX) onReply(message);
    startX.current = null;
    dragX.current = 0;
    if (wrapperRef.current) {
      wrapperRef.current.style.transition = 'transform 180ms ease-out';
      wrapperRef.current.style.transform = 'translateX(0px)';
      setTimeout(() => {
        if (wrapperRef.current) wrapperRef.current.style.transition = '';
      }, 200);
    }
  };

  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const tickColor = isOutgoing
    ? message.is_read
      ? 'text-tick-read'
      : 'text-bubble-out-foreground/60'
    : '';

  const bubbleBase = isOutgoing
    ? 'bg-bubble-out text-bubble-out-foreground'
    : 'bg-bubble-in text-bubble-in-foreground border border-border';

  // WhatsApp-like asymmetric corner: small corner near tail
  const cornerClass = isOutgoing
    ? showTail ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl'
    : showTail ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl';

  return (
    <div
      className={`group flex w-full ${isOutgoing ? 'justify-end' : 'justify-start'} px-2`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div ref={wrapperRef} className="relative max-w-[78%] sm:max-w-[65%] flex items-end gap-1">
        {/* Hover reply button (desktop) */}
        <button
          type="button"
          onClick={() => onReply(message)}
          className={`opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-full bg-card border border-border shadow-sm hidden sm:flex items-center justify-center ${
            isOutgoing ? 'order-first' : 'order-last'
          }`}
          aria-label="Reply"
        >
          <Reply className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <div className={`relative px-2 py-1.5 shadow-sm ${bubbleBase} ${cornerClass}`}>
          {/* Quoted reply preview */}
          {repliedTo && (
            <button
              type="button"
              onClick={() => onJumpTo?.(repliedTo.id)}
              className={`block w-full text-left mb-1 rounded-md px-2 py-1 border-l-2 ${
                isOutgoing
                  ? 'bg-bubble-out-foreground/10 border-bubble-out-foreground/60'
                  : 'bg-foreground/5 border-primary'
              }`}
            >
              <div className={`text-[11px] font-semibold ${isOutgoing ? 'text-bubble-out-foreground/90' : 'text-primary'}`}>
                {repliedToSenderName || 'Reply'}
              </div>
              <div className={`text-xs truncate ${isOutgoing ? 'text-bubble-out-foreground/80' : 'text-muted-foreground'}`}>
                {repliedTo.message_type === 'image' ? '📷 Photo' :
                 repliedTo.message_type === 'voice' ? '🎤 Voice message' :
                 repliedTo.content || ''}
              </div>
            </button>
          )}

          {/* Body */}
          {message.message_type === 'image' && message.media_url ? (
            <img
              src={message.media_url}
              alt="Shared"
              className="rounded-lg max-h-72 w-auto object-cover"
            />
          ) : message.message_type === 'voice' && message.media_url ? (
            <VoiceMessagePlayer
              url={message.media_url}
              duration={message.duration_seconds ?? null}
              isOutgoing={isOutgoing}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words pr-12">
              {message.content}
            </p>
          )}

          {/* Time + ticks pinned bottom-right */}
          <div className={`flex items-center justify-end gap-1 -mt-0.5 ${
            message.message_type === 'image' ? 'mt-1' : ''
          }`}>
            <span className={`text-[10px] tabular-nums ${
              isOutgoing ? 'text-bubble-out-foreground/70' : 'text-muted-foreground'
            }`}>{time}</span>
            {isOutgoing && (
              message.is_read
                ? <CheckCheck className={`h-3.5 w-3.5 ${tickColor}`} />
                : <Check className={`h-3.5 w-3.5 ${tickColor}`} />
            )}
          </div>
        </div>
      </div>

      {/* Reactions */}
      {(message.reactions && message.reactions.length > 0) || true ? (
        <div className="hidden" />
      ) : null}

      {/* External reactions row, kept visible below bubble */}
      <div className={`absolute ${isOutgoing ? 'right-2' : 'left-2'} translate-y-5`}>
        <MessageReactions
          messageId={message.id}
          reactions={message.reactions}
          onReact={onReact}
        />
      </div>
    </div>
  );
};

export default ChatBubble;