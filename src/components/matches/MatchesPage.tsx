
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, MessageSquare, Search } from 'lucide-react';
import ChatView from './ChatView';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import WhoLikedYou from '@/components/discover/WhoLikedYou';
import StoryTray from '@/components/stories/StoryTray';

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  other_user: {
    id: string;
    first_name: string;
    bio?: string;
    last_active?: string;
    has_accommodation_available?: boolean;
    profile_photos: { photo_url: string; is_primary: boolean }[];
  };
  conversation: {
    id: string;
    last_message_at: string;
  };
}

interface MatchWithDetails extends Match {
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount: number;
}

const MatchesPage = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesWithDetails, setMatchesWithDetails] = useState<MatchWithDetails[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-for-match-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const conversationId = (payload.new as any)?.conversation_id || (payload.old as any)?.conversation_id;
          const isRelevant = matches.some(m => m.conversation.id === conversationId);
          if (isRelevant) {
            fetchMatches();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, matches]);

  const fetchMatches = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch matches separately to handle RLS policies correctly
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        return;
      }

      if (!matchesData || matchesData.length === 0) {
        setMatches([]);
        setMatchesWithDetails([]);
        return;
      }

      // Get conversations for matches
      const matchIds = matchesData.map(m => m.id);
      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('id, match_id, last_message_at')
        .in('match_id', matchIds);

      // Get profile data for matched users
      const userIds = new Set<string>();
      matchesData.forEach(match => {
        userIds.add(match.user1_id);
        userIds.add(match.user2_id);
      });
      userIds.delete(user.id); // Remove current user

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, bio, last_active, has_accommodation_available')
        .in('id', Array.from(userIds));

      // Get photos for matched users
      const { data: photosData } = await supabase
        .from('profile_photos')
        .select('user_id, photo_url, is_primary')
        .in('user_id', Array.from(userIds))
        .order('is_primary', { ascending: false });

      // Combine the data
      const data = matchesData.map(match => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const otherProfile = profilesData?.find(p => p.id === otherUserId);
        const otherPhotos = photosData?.filter(p => p.user_id === otherUserId) || [];
        const conversation = conversationsData?.find(c => c.match_id === match.id);

        return {
          ...match,
          user1: match.user1_id === user.id ? null : {
            id: otherUserId,
            first_name: otherProfile?.first_name || 'Unknown',
            bio: otherProfile?.bio || '',
            last_active: otherProfile?.last_active,
            has_accommodation_available: otherProfile?.has_accommodation_available,
            profile_photos: otherPhotos
          },
          user2: match.user2_id === user.id ? null : {
            id: otherUserId,
            first_name: otherProfile?.first_name || 'Unknown',
            bio: otherProfile?.bio || '',
            last_active: otherProfile?.last_active,
            has_accommodation_available: otherProfile?.has_accommodation_available,
            profile_photos: otherPhotos
          },
          conversations: conversation ? [conversation] : []
        };
      });

      const error = null;

      const formattedMatches = data.map((match: any) => ({
        ...match,
        other_user: match.user1_id === user?.id ? match.user2 : match.user1,
        conversation: match.conversations[0] || { id: '', last_message_at: match.created_at }
      }));

      setMatches(formattedMatches);
      await fetchMatchesDetails(formattedMatches);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchMatchesDetails = async (matchesToDetail: Match[]) => {
    if (matchesToDetail.length > 0 && user) {
        const detailedMatches = await Promise.all(
          matchesToDetail.map(async (match) => {
            const { data: lastMessageData } = await supabase
              .from('messages')
              .select('content, created_at, sender_id')
              .eq('conversation_id', match.conversation.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', match.conversation.id)
              .eq('is_read', false)
              .neq('sender_id', user.id);

            return {
              ...match,
              lastMessage: lastMessageData || undefined,
              unreadCount: unreadCount || 0,
            };
          })
        );
      
        detailedMatches.sort((a, b) => {
          const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : new Date(a.created_at).getTime();
          const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : new Date(b.created_at).getTime();
          return timeB - timeA;
        });

        setMatchesWithDetails(detailedMatches);
    } else {
      setMatchesWithDetails([]);
    }
  };


  if (selectedMatch) {
    return (
      <ChatView 
        match={selectedMatch} 
        onBack={() => {
          setSelectedMatch(null);
          fetchMatches(); // Refetch when going back to the list
        }} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="h-8 w-40 bg-muted animate-pulse rounded-lg mx-auto mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-3 w-10 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
          Messages 💬
        </h1>
        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="likes">Likes</TabsTrigger>
          </TabsList>
          <TabsContent value="messages">
            <StoryTray />
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or message"
                className="pl-9"
              />
            </div>
            {matchesWithDetails.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                No conversations yet
              </h2>
              <p className="text-muted-foreground">
                When you match with someone, your conversation will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {matchesWithDetails
              .filter((match) => {
                const q = searchQuery.trim().toLowerCase();
                if (!q) return true;
                const nameHit = match.other_user.first_name?.toLowerCase().includes(q);
                const msgHit = match.lastMessage?.content?.toLowerCase().includes(q);
                return nameHit || msgHit;
              })
              .map((match) => (
              <Card 
                key={match.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedMatch(match)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                        {(() => {
                          const primary = match.other_user.profile_photos?.find(p => p.is_primary);
                          const fallback = match.other_user.profile_photos?.[0];
                          const avatarUrl = primary?.photo_url || fallback?.photo_url || '/placeholder.svg';
                          return (
                            <img
                              src={avatarUrl}
                              alt={match.other_user.first_name}
                              className="w-full h-full object-cover"
                            />
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {match.other_user.first_name}
                          </h3>
                          {match.other_user.has_accommodation_available && (
                            <span className="text-xs" title="Has a venue available">🏠</span>
                          )}
                        </div>
                        {match.lastMessage && (
                           <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {new Date(match.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-muted-foreground truncate">
                          {match.lastMessage ? 
                            `${match.lastMessage.sender_id === user?.id ? 'You: ' : ''}${match.lastMessage.content || '📷 Photo'}`
                            : `Matched on ${new Date(match.created_at).toLocaleDateString()}`
                          }
                        </p>
                        {match.unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground flex-shrink-0 ml-2">{match.unreadCount}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            )}
          </TabsContent>
          <TabsContent value="likes">
            <WhoLikedYou />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MatchesPage;
