import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video } from 'lucide-react';
import CallModal from './CallModal';
import { logger } from '@/utils/logger';

interface IncomingCall {
  id: string;
  caller_id: string;
  call_type: 'audio' | 'video';
  match_id: string;
}

interface CallerInfo {
  first_name: string;
  photo_url: string | null;
}

/**
 * Global listener that watches for new `calls` rows where the user is the callee
 * and shows an incoming-call sheet. Mounted once at the app root (inside AppGate).
 */
const IncomingCallListener: React.FC = () => {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);
  const [active, setActive] = useState<IncomingCall | null>(null);
  const incomingRef = useRef<IncomingCall | null>(null);
  useEffect(() => { incomingRef.current = incoming; }, [incoming]);

  // Pre-build a ringtone using WebAudio (so we don't ship an mp3)
  useEffect(() => {
    if (!incoming) return;
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    // Vibrate in a ringing pattern on supported devices
    const vibrate = () => {
      try { (navigator as any).vibrate?.([600, 400, 600, 1500]); } catch {}
    };
    vibrate();
    const vi = setInterval(vibrate, 3000);
    if (!Ctx) return () => { clearInterval(vi); try { (navigator as any).vibrate?.(0); } catch {} };
    const ctx = new Ctx();
    let stopped = false;
    const playBeep = () => {
      if (stopped) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 520;
      osc.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    };
    playBeep();
    const i = setInterval(playBeep, 1500);
    return () => {
      stopped = true;
      clearInterval(i);
      clearInterval(vi);
      try { (navigator as any).vibrate?.(0); } catch {}
      ctx.close().catch(() => {});
    };
  }, [incoming]);

  const fetchCaller = useCallback(async (callerId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', callerId)
      .maybeSingle();
    const { data: photo } = await supabase
      .from('profile_photos')
      .select('photo_url, is_primary')
      .eq('user_id', callerId)
      .order('is_primary', { ascending: false })
      .limit(1)
      .maybeSingle();
    setCallerInfo({
      first_name: profile?.first_name || 'Someone',
      photo_url: photo?.photo_url || null,
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`incoming-calls:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calls', filter: `callee_id=eq.${user.id}` },
        (payload) => {
          const call = payload.new as any;
          if (call.status !== 'ringing') return;
          setIncoming({
            id: call.id, caller_id: call.caller_id,
            call_type: call.call_type, match_id: call.match_id,
          });
          fetchCaller(call.caller_id);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calls', filter: `callee_id=eq.${user.id}` },
        (payload) => {
          const call = payload.new as any;
          // Caller cancelled before we accepted (use ref to avoid stale closure)
          const cur = incomingRef.current;
          if (cur && call.id === cur.id && ['cancelled', 'ended', 'missed'].includes(call.status)) {
            setIncoming(null);
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchCaller]);

  // Auto-mark missed after 45s of ringing
  useEffect(() => {
    if (!incoming) return;
    const t = setTimeout(async () => {
      try {
        await supabase.from('calls').update({ status: 'missed' }).eq('id', incoming.id);
      } catch (e) { logger.error('auto-miss failed', e); }
      setIncoming(null);
    }, 45000);
    return () => clearTimeout(t);
  }, [incoming]);

  const accept = async () => {
    if (!incoming) return;
    try {
      await supabase.from('calls').update({
        status: 'accepted', accepted_at: new Date().toISOString(),
      }).eq('id', incoming.id);
      setActive(incoming);
      setIncoming(null);
    } catch (e) { logger.error(e); }
  };

  const decline = async () => {
    if (!incoming) return;
    try {
      await supabase.from('calls').update({ status: 'declined' }).eq('id', incoming.id);
    } catch (e) { logger.error(e); }
    setIncoming(null);
  };

  return (
    <>
      {incoming && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-b from-background via-background to-primary/10 flex flex-col items-center justify-between py-16 px-6 animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-6 mt-12">
            <p className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              {incoming.call_type === 'video' ? <Video size={14} /> : <Phone size={14} />}
              Incoming {incoming.call_type} call
            </p>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-40 h-40 rounded-full overflow-hidden bg-muted ring-4 ring-primary/40">
                <img
                  src={callerInfo?.photo_url || '/placeholder.svg'}
                  alt={callerInfo?.first_name || 'Caller'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h2 className="text-3xl font-semibold text-foreground">{callerInfo?.first_name || 'Someone'}</h2>
          </div>
          <div className="flex items-center justify-center gap-16 w-full pb-8">
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                variant="destructive"
                onClick={decline}
                className="h-16 w-16 rounded-full shadow-lg"
                aria-label="Decline call"
              >
                <PhoneOff className="h-7 w-7" />
              </Button>
              <span className="text-xs text-muted-foreground">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                onClick={accept}
                className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg animate-pulse"
                aria-label="Accept call"
              >
                <Phone className="h-7 w-7" />
              </Button>
              <span className="text-xs text-muted-foreground">Accept</span>
            </div>
          </div>
        </div>
      )}

      {active && user && (
        <CallModal
          open
          callId={active.id}
          selfId={user.id}
          role="callee"
          callType={active.call_type}
          peerName={callerInfo?.first_name || 'Caller'}
          peerPhotoUrl={callerInfo?.photo_url}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
};

export default IncomingCallListener;