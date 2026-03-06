import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityStatusProps {
  userId: string;
  lastActive?: string;
  showOnlineStatus?: boolean;
}

const ActivityStatus = ({ userId, lastActive, showOnlineStatus = true }: ActivityStatusProps) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!showOnlineStatus) return;
    const channel = supabase.channel(`user_${userId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setIsOnline(Object.keys(state).length > 0);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, showOnlineStatus]);

  const getLastSeenText = (lastActiveDate?: string) => {
    if (!lastActiveDate) return 'Last seen a while ago';
    const lastSeen = new Date(lastActiveDate);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `Active ${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Active ${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Active ${diffInDays}d ago`;
    return 'Last seen a while ago';
  };

  const isRecentlyActive = lastActive && 
    (new Date().getTime() - new Date(lastActive).getTime()) < (5 * 60 * 1000);

  if (showOnlineStatus && (isOnline || isRecentlyActive)) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Circle size={8} className="fill-emerald-500 text-emerald-500 mr-1" />
        Online
      </Badge>
    );
  }

  return (
    <div className="text-xs text-muted-foreground">
      {getLastSeenText(lastActive)}
    </div>
  );
};

export default ActivityStatus;
