import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

interface LiveMessageIndicatorProps {
  isOnline: boolean;
  isTyping: boolean;
  userName: string;
}

const LiveMessageIndicator: React.FC<LiveMessageIndicatorProps> = ({
  isOnline,
  isTyping,
  userName
}) => {
  if (isTyping) {
    return (
      <div className="flex items-center gap-2 text-sm text-primary">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span>typing...</span>
      </div>
    );
  }

  if (isOnline) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Circle size={8} className="fill-emerald-500 text-emerald-500 mr-1" />
        Online
      </Badge>
    );
  }

  return (
    <span className="text-xs text-muted-foreground">
      Last seen recently
    </span>
  );
};

export default LiveMessageIndicator;
