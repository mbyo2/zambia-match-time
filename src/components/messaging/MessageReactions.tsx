import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MessageReactionsProps {
  messageId: string;
  reactions?: { emoji: string; count: number; userReacted: boolean }[];
  onReact: (messageId: string, emoji: string) => void;
}

const commonEmojis = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎'];

const MessageReactions: React.FC<MessageReactionsProps> = ({ 
  messageId, 
  reactions = [], 
  onReact 
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReaction = (emoji: string) => {
    onReact(messageId, emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative">
      {/* Existing reactions */}
      {reactions.length > 0 && (
        <div className="flex gap-1 mb-2">
          {reactions.map((reaction, index) => (
            <Button
              key={index}
              variant={reaction.userReacted ? "default" : "outline"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleReaction(reaction.emoji)}
            >
              {reaction.emoji} {reaction.count}
            </Button>
          ))}
        </div>
      )}

      {/* Add reaction button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      >
        +
      </Button>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-8 left-0 bg-white border rounded-lg shadow-lg p-2 flex gap-1 z-10">
          {commonEmojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleReaction(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageReactions;
