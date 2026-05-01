import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useWebRTCCall, type CallType, type CallRole } from '@/hooks/useWebRTCCall';

interface CallModalProps {
  open: boolean;
  callId: string;
  selfId: string;
  role: CallRole;
  callType: CallType;
  peerName: string;
  peerPhotoUrl?: string | null;
  onClose: () => void;
}

const CallModal: React.FC<CallModalProps> = ({
  open, callId, selfId, role, callType, peerName, peerPhotoUrl, onClose,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [elapsed, setElapsed] = useState(0);

  const {
    phase, micOn, camOn, localStream, remoteStream, error,
    toggleMic, toggleCam, hangup,
  } = useWebRTCCall({
    callId, selfId, role, callType,
    enabled: open,
    onRemoteEnded: () => {
      setTimeout(onClose, 800);
    },
  });

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (phase !== 'connected') return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'ended') {
      const t = setTimeout(onClose, 600);
      return () => clearTimeout(t);
    }
  }, [phase, onClose]);

  const handleHangup = async () => {
    await hangup(role === 'caller' && phase === 'ringing' ? 'cancelled' : 'ended');
    onClose();
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const statusLabel =
    phase === 'ringing' ? 'Ringing…'
    : phase === 'connecting' ? 'Connecting…'
    : phase === 'connected' ? fmt(elapsed)
    : phase === 'ended' ? 'Call ended'
    : '';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleHangup(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-background border-border">
        <div className="relative h-[70vh] min-h-[480px] bg-gradient-to-b from-muted to-background flex flex-col">
          {/* Remote video / avatar */}
          {callType === 'video' && remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-muted ring-4 ring-primary/20">
                <img
                  src={peerPhotoUrl || '/placeholder.svg'}
                  alt={peerName}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">{peerName}</h2>
              <p className="text-sm text-muted-foreground">{statusLabel}</p>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </div>
          )}

          {/* Top status bar (video mode) */}
          {callType === 'video' && (
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <div className="bg-background/70 backdrop-blur rounded-full px-3 py-1 text-sm text-foreground">
                {peerName}
              </div>
              <div className="bg-background/70 backdrop-blur rounded-full px-3 py-1 text-xs text-foreground">
                {statusLabel}
              </div>
            </div>
          )}

          {/* Local preview */}
          {callType === 'video' && localStream && (
            <video
              ref={localVideoRef}
              autoPlay playsInline muted
              className="absolute bottom-24 right-4 w-24 h-32 rounded-lg object-cover border border-border bg-black z-10"
            />
          )}

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-4 z-20 bg-gradient-to-t from-background/90 to-transparent">
            <Button
              size="icon"
              variant={micOn ? 'secondary' : 'default'}
              onClick={toggleMic}
              className="h-14 w-14 rounded-full"
              aria-label={micOn ? 'Mute' : 'Unmute'}
            >
              {micOn ? <Mic /> : <MicOff />}
            </Button>
            {callType === 'video' && (
              <Button
                size="icon"
                variant={camOn ? 'secondary' : 'default'}
                onClick={toggleCam}
                className="h-14 w-14 rounded-full"
                aria-label={camOn ? 'Camera off' : 'Camera on'}
              >
                {camOn ? <Video /> : <VideoOff />}
              </Button>
            )}
            <Button
              size="icon"
              variant="destructive"
              onClick={handleHangup}
              className="h-14 w-14 rounded-full"
              aria-label="Hang up"
            >
              <PhoneOff />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallModal;