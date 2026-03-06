import React from 'react';

interface TypingIndicatorProps {
  userName: string;
  isVisible: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span>{userName} is typing...</span>
    </div>
  );
};

export default TypingIndicator;
