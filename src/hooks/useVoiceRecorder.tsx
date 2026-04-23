import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/utils/logger';

export interface VoiceRecording {
  blob: Blob;
  durationSeconds: number;
  mimeType: string;
}

/**
 * MediaRecorder-based voice note recorder. Mirrors WhatsApp UX:
 * - press to start, release to send (caller decides on cancel/send).
 * - tracks duration in seconds.
 */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolverRef = useRef<((rec: VoiceRecording | null) => void) | null>(null);
  const cancelledRef = useRef(false);

  const cleanup = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async (): Promise<boolean> => {
    if (isRecording) return false;
    setError(null);
    cancelledRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick a widely-supported mime
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const mimeType = candidates.find(c => (window as any).MediaRecorder?.isTypeSupported?.(c)) || '';

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const duration = (Date.now() - startedAtRef.current) / 1000;
        const usedMime = mr.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: usedMime });
        const resolver = resolverRef.current;
        resolverRef.current = null;
        cleanup();
        setIsRecording(false);
        setDurationSeconds(0);
        if (cancelledRef.current || blob.size === 0) {
          resolver?.(null);
        } else {
          resolver?.({ blob, durationSeconds: duration, mimeType: usedMime });
        }
      };

      mr.start();
      startedAtRef.current = Date.now();
      setIsRecording(true);
      setDurationSeconds(0);
      tickRef.current = setInterval(() => {
        setDurationSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
      return true;
    } catch (e: any) {
      logger.error('Voice recorder failed to start:', e);
      setError(e?.message || 'Microphone permission denied');
      cleanup();
      setIsRecording(false);
      return false;
    }
  }, [isRecording, cleanup]);

  const stop = useCallback((): Promise<VoiceRecording | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }
      resolverRef.current = resolve;
      try {
        mediaRecorderRef.current.stop();
      } catch {
        resolve(null);
      }
    });
  }, []);

  const cancel = useCallback(async () => {
    cancelledRef.current = true;
    await stop();
  }, [stop]);

  return { isRecording, durationSeconds, error, start, stop, cancel };
}