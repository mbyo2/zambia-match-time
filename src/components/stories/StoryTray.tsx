import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryGroup {
  user_id: string;
  first_name: string;
  photo_url: string | null;
  latest_at: string;
  has_unviewed: boolean;
}

const StoryTray: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [ownHasStory, setOwnHasStory] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    const { data: stories } = await supabase
      .from('stories')
      .select('id, user_id, created_at, expires_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!stories || stories.length === 0) {
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set(stories.map((s) => s.user_id)));
    setOwnHasStory(stories.some((s) => s.user_id === user.id));

    const otherIds = userIds.filter((id) => id !== user.id);
    if (otherIds.length === 0) {
      setLoading(false);
      return;
    }

    const [{ data: profiles }, { data: photos }, { data: viewed }] = await Promise.all([
      supabase.from('profiles').select('id, first_name').in('id', otherIds),
      supabase.from('profile_photos').select('user_id, photo_url, is_primary').in('user_id', otherIds),
      supabase.from('story_views').select('story_id').eq('viewer_id', user.id),
    ]);

    const viewedSet = new Set((viewed || []).map((v: any) => v.story_id));
    const grouped: StoryGroup[] = otherIds.map((uid) => {
      const userStories = stories.filter((s) => s.user_id === uid);
      const profile = profiles?.find((p: any) => p.id === uid);
      const primary =
        photos?.find((p: any) => p.user_id === uid && p.is_primary) ||
        photos?.find((p: any) => p.user_id === uid);
      return {
        user_id: uid,
        first_name: profile?.first_name || 'User',
        photo_url: primary?.photo_url || null,
        latest_at: userStories[0]?.created_at || '',
        has_unviewed: userStories.some((s) => !viewedSet.has(s.id)),
      };
    });

    setGroups(grouped.sort((a, b) => (a.has_unviewed === b.has_unviewed ? 0 : a.has_unviewed ? -1 : 1)));
    setLoading(false);
  };

  if (loading) return null;
  if (!ownHasStory && groups.length === 0) return null;

  return (
    <div className="mb-4 -mx-4 px-4 overflow-x-auto">
      <div className="flex gap-3 pb-2">
        <div className="flex flex-col items-center gap-1 flex-shrink-0 w-16">
          <div className="relative w-14 h-14 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <span className="text-[10px] text-muted-foreground truncate w-full text-center">Your Story</span>
        </div>

        {groups.map((g) => (
          <button
            key={g.user_id}
            className="flex flex-col items-center gap-1 flex-shrink-0 w-16"
            type="button"
          >
            <div
              className={cn(
                'relative w-14 h-14 rounded-full p-[2px]',
                g.has_unviewed ? 'bg-gradient-to-tr from-primary to-pink-500' : 'bg-muted'
              )}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-muted border-2 border-background">
                {g.photo_url ? (
                  <img src={g.photo_url} alt={g.first_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold">
                    {g.first_name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-foreground truncate w-full text-center">{g.first_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StoryTray;
