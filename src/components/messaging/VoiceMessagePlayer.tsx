import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { formatVoiceDuration } from '@/utils/chatTime';

interface Props {
  url: string;
  duration?: number | null;
  isOutgoing: boolean;
}

/** Mini WhatsApp-style voice player with a fake waveform. */
const VoiceMessagePlayer: React.FC<Props> = ({ url, duration, isOutgoing }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [knownDuration, setKnownDuration] = useState<number | null>(duration ?? null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      if (a.duration && isFinite(a.duration)) {
        setProgress(a.currentTime / a.duration);
        if (!knownDuration) setKnownDuration(a.duration);
      }
    };
    const onEnded = () => { setPlaying(false); setProgress(0); };
    const onMeta = () => {
      if (a.duration && isFinite(a.duration) && !knownDuration) {
        setKnownDuration(a.duration);
      }
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnded);
    a.addEventListener('loadedmetadata', onMeta);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('loadedmetadata', onMeta);
    };
  }, [knownDuration]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  };

  // Deterministic faux-waveform bar heights
  const bars = Array.from({ length: 28 }, (_, i) => 4 + ((i * 37) % 14));
  const playedBars = Math.round(bars.length * progress);

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <button
        type="button"
        onClick={toggle}
        className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${
          isOutgoing ? 'bg-bubble-out-foreground/15' : 'bg-foreground/10'
        }`}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex items-center gap-[2px] h-6">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`w-[2px] rounded-full ${
              i < playedBars
                ? isOutgoing ? 'bg-bubble-out-foreground' : 'bg-primary'
                : isOutgoing ? 'bg-bubble-out-foreground/40' : 'bg-foreground/30'
            }`}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
      <span className={`text-[11px] tabular-nums ${
        isOutgoing ? 'text-bubble-out-foreground/80' : 'text-muted-foreground'
      }`}>
        {formatVoiceDuration(knownDuration ?? 0)}
      </span>
      <audio ref={audioRef} src={url} preload="metadata" />
    </div>
  );
};

export default VoiceMessagePlayer;