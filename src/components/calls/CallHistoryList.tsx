import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Video } from 'lucide-react';
import { logger } from '@/utils/logger';

interface CallRow {
  id: string;
  caller_id: string;
  callee_id: string;
  call_type: 'audio' | 'video';
  status: string;
  started_at: string;
  duration_seconds: number | null;
  peer?: { id: string; first_name: string; photo?: string } | null;
}

const CallHistoryList: React.FC = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('calls')
          .select('id, caller_id, callee_id, call_type, status, started_at, duration_seconds')
          .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
          .order('started_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        const rows = (data || []) as CallRow[];
        const peerIds = Array.from(new Set(rows.map(r => r.caller_id === user.id ? r.callee_id : r.caller_id)));
        let profiles: any[] = [];
        let photos: any[] = [];
        if (peerIds.length) {
          const [{ data: ps }, { data: phs }] = await Promise.all([
            supabase.from('profiles').select('id, first_name').in('id', peerIds),
            supabase.from('profile_photos').select('user_id, photo_url, is_primary').in('user_id', peerIds),
          ]);
          profiles = ps || [];
          photos = phs || [];
        }
        const enriched = rows.map(r => {
          const peerId = r.caller_id === user.id ? r.callee_id : r.caller_id;
          const p = profiles.find(x => x.id === peerId);
          const photo = photos.find(x => x.user_id === peerId && x.is_primary)?.photo_url
            || photos.find(x => x.user_id === peerId)?.photo_url;
          return { ...r, peer: p ? { id: peerId, first_name: p.first_name, photo } : null };
        });
        if (active) setCalls(enriched);
      } catch (e) {
        logger.error('CallHistory load failed', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();

    const ch = supabase
      .channel('calls-history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, () => load())
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Phone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No calls yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {calls.map(c => {
        const outgoing = c.caller_id === user?.id;
        // Missed = incoming call the user never picked up (callee perspective)
        const missed = !outgoing && (c.status === 'missed' || c.status === 'cancelled' || c.status === 'ringing');
        // Status label
        let label: string;
        if (c.status === 'accepted' || c.status === 'ended') {
          label = c.duration_seconds
            ? `${Math.floor(c.duration_seconds / 60)}:${String(c.duration_seconds % 60).padStart(2, '0')}`
            : 'Ended';
        } else if (missed) {
          label = 'Missed';
        } else if (c.status === 'declined') {
          label = outgoing ? 'Declined' : 'Declined by you';
        } else if (c.status === 'cancelled') {
          label = outgoing ? 'Cancelled' : 'Missed';
        } else if (c.status === 'ringing') {
          label = outgoing ? 'No answer' : 'Missed';
        } else {
          label = c.status;
        }
        const DirIcon = missed ? PhoneMissed : (outgoing ? PhoneOutgoing : PhoneIncoming);
        const Icon = c.call_type === 'video' ? Video : DirIcon;
        return (
          <Card key={c.id}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                <img src={c.peer?.photo || '/placeholder.svg'} alt={c.peer?.first_name || 'User'} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${missed ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <p className="font-medium truncate">{c.peer?.first_name || 'Unknown'}</p>
                </div>
                <p className={`text-xs capitalize ${missed ? 'text-destructive' : 'text-muted-foreground'}`}>{c.call_type} · {label}</p>
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0">
                {new Date(c.started_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CallHistoryList;