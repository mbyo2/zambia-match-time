import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Flame, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ErrorBoundary from './ErrorBoundary';

const tabs = [
  { to: '/app/discover', icon: Flame, label: 'Discover', id: 'discover' },
  { to: '/app/matches', icon: MessageCircle, label: 'Matches', id: 'matches' },
  { to: '/app/profile', icon: User, label: 'Profile', id: 'profile' },
];

const MainLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', user.id)
      .eq('is_read', false);
    if (count !== null && count !== undefined) setUnreadCount(count);
  };

  useEffect(() => {
    if (user) fetchUnreadCount();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('unread-messages-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchUnreadCount();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (location.pathname.startsWith('/app/matches')) {
      const t = setTimeout(() => setUnreadCount(0), 1500);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  // Hide bottom nav on sub-pages (anything beyond the 3 main tabs)
  const isMainTab = tabs.some(t => location.pathname === t.to);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className={cn("flex-1 overflow-hidden", isMainTab && "pb-16")}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {isMainTab && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50">
          <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
            {tabs.map(({ to, icon: Icon, label, id }) => (
              <NavLink
                key={id}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )
                }
                aria-label={label}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn("h-6 w-6", isActive && id === 'discover' && "fill-primary")}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                    <span className="text-[10px] font-medium">{label}</span>
                    {id === 'matches' && unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

export default MainLayout;
