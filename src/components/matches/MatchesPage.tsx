
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Heart } from 'lucide-react';
import ChatView from './ChatView';

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

const MatchesPage = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
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
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
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
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedMatch) {
    return (
      <ChatView 
        match={selectedMatch} 
        onBack={() => setSelectedMatch(null)} 
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
          Your Matches 💖
        </h1>

        {matches.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                No matches yet
              </h2>
              <p className="text-gray-500">
                Keep swiping to find your perfect match!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <Card 
                key={match.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedMatch(match)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                      {match.other_user.profile_photos?.find(p => p.is_primary) ? (
                        <img
                          src={match.other_user.profile_photos.find(p => p.is_primary)?.photo_url}
                          alt={match.other_user.first_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          {match.other_user.first_name[0]}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {match.other_user.first_name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {match.other_user.bio || 'No bio available'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Matched {new Date(match.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <Button variant="ghost" size="sm">
                      <MessageCircle size={20} />
                    </Button>
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
