
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, MessageSquare } from 'lucide-react';
import ChatView from './ChatView';
import { Badge } from '@/components/ui/badge';

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  other_user: {
    id: string;
    first_name: string;
    bio?: string;
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
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          conversations!inner (id, last_message_at),
          user1:profiles!matches_user1_id_fkey (
            id, first_name, bio,
            profile_photos (photo_url, is_primary)
          ),
          user2:profiles!matches_user2_id_fkey (
            id, first_name, bio,
            profile_photos (photo_url, is_primary)
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching matches:', error);
        return;
      }

      const formattedMatches = data?.map((match: any) => ({
        ...match,
        other_user: match.user1_id === user?.id ? match.user2 : match.user1,
        conversation: match.conversations[0]
      })) || [];

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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Messages 💬
        </h1>

        {matchesWithDetails.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                No conversations yet
              </h2>
              <p className="text-gray-500">
                When you match with someone, your conversation will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {matchesWithDetails.map((match) => (
              <Card 
                key={match.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedMatch(match)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                        {match.other_user.profile_photos?.find(p => p.is_primary) ? (
                          <img
                            src={match.other_user.profile_photos.find(p => p.is_primary)?.photo_url}
                            alt={match.other_user.first_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                            {match.other_user.first_name[0]}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {match.other_user.first_name}
                        </h3>
                        {match.lastMessage && (
                           <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {new Date(match.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {match.lastMessage ? 
                            `${match.lastMessage.sender_id === user?.id ? 'You: ' : ''}${match.lastMessage.content}`
                            : `Matched on ${new Date(match.created_at).toLocaleDateString()}`
                          }
                        </p>
                        {match.unreadCount > 0 && (
                          <Badge className="bg-pink-500 text-white flex-shrink-0 ml-2">{match.unreadCount}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchesPage;
