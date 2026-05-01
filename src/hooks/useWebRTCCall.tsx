import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export type CallType = 'audio' | 'video';
export type CallRole = 'caller' | 'callee';
export type CallPhase = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended';

interface UseWebRTCCallOptions {
  callId: string;
  selfId: string;
  role: CallRole;
  callType: CallType;
  enabled: boolean;
  onRemoteEnded?: () => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * Minimal 1:1 WebRTC client using a Supabase Realtime broadcast channel for signaling.
 * Channel name: `call:<callId>`. Events: 'signal' with { from, type: 'offer'|'answer'|'ice'|'bye', payload }.
 */
export function useWebRTCCall({ callId, selfId, role, callType, enabled, onRemoteEnded }: UseWebRTCCallOptions) {
  const [phase, setPhase] = useState<CallPhase>('idle');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(callType === 'video');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  const sendSignal = useCallback((type: string, payload: any) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { from: selfId, type, payload },
    });
  }, [selfId]);

  const cleanup = useCallback(() => {
    try { pcRef.current?.getSenders().forEach(s => s.track?.stop()); } catch {}
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const hangup = useCallback(async (reason: 'ended' | 'cancelled' | 'declined' = 'ended') => {
    try { sendSignal('bye', { reason }); } catch {}
    cleanup();
    setPhase('ended');
    try {
      const updates: any = { status: reason };
      if (reason === 'ended') {
        updates.ended_at = new Date().toISOString();
      }
      await supabase.from('calls').update(updates).eq('id', callId);
    } catch (e) { logger.error('hangup update failed', e); }
  }, [callId, sendSignal, cleanup]);

  const toggleMic = useCallback(() => {
    const next = !micOn;
    setMicOn(next);
    localStreamRef.current?.getAudioTracks().forEach(t => (t.enabled = next));
  }, [micOn]);

  const toggleCam = useCallback(() => {
    const next = !camOn;
    setCamOn(next);
    localStreamRef.current?.getVideoTracks().forEach(t => (t.enabled = next));
  }, [camOn]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const init = async () => {
      try {
        // 1. Get media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video',
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        setLocalStream(stream);

        // 2. Peer connection
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;
        stream.getTracks().forEach(t => pc.addTrack(t, stream));

        const remote = new MediaStream();
        setRemoteStream(remote);
        pc.ontrack = (ev) => {
          ev.streams[0]?.getTracks().forEach(t => remote.addTrack(t));
          setRemoteStream(new MediaStream(remote.getTracks()));
          setPhase('connected');
        };
        pc.onicecandidate = (ev) => {
          if (ev.candidate) sendSignal('ice', ev.candidate.toJSON());
        };
        pc.onconnectionstatechange = () => {
          if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
            if (phase !== 'ended') hangup('ended');
          }
        };

        // 3. Signaling channel
        const ch = supabase.channel(`call:${callId}`, { config: { broadcast: { self: false } } });
        channelRef.current = ch;

        ch.on('broadcast', { event: 'signal' }, async ({ payload }) => {
          if (!payload || payload.from === selfId) return;
          try {
            if (payload.type === 'offer' && role === 'callee') {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
              for (const c of pendingIceRef.current) await pc.addIceCandidate(c);
              pendingIceRef.current = [];
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              sendSignal('answer', answer);
              setPhase('connecting');
            } else if (payload.type === 'answer' && role === 'caller') {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
              setPhase('connecting');
            } else if (payload.type === 'ice') {
              if (pc.remoteDescription) await pc.addIceCandidate(payload.payload);
              else pendingIceRef.current.push(payload.payload);
            } else if (payload.type === 'bye') {
              onRemoteEnded?.();
              cleanup();
              setPhase('ended');
            } else if (payload.type === 'ready' && role === 'caller') {
              // Callee joined — send offer
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendSignal('offer', offer);
            }
          } catch (e) {
            logger.error('signal handler failed', e);
          }
        });

        ch.subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') return;
          if (role === 'callee') {
            // Tell caller we're ready
            sendSignal('ready', {});
            setPhase('connecting');
          } else {
            setPhase('ringing');
          }
        });
      } catch (e: any) {
        logger.error('WebRTC init failed', e);
        setError(e?.message || 'Could not access camera/mic');
        setPhase('ended');
      }
    };

    init();
    return () => { cancelled = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, callId, selfId, role, callType]);

  return { phase, micOn, camOn, localStream, remoteStream, error, toggleMic, toggleCam, hangup };
}