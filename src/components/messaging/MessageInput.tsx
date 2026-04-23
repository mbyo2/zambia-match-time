import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image as ImageIcon, Mic, X, Trash2 } from 'lucide-react';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { uploadVoiceNote } from '@/utils/voiceUpload';
import { formatVoiceDuration } from '@/utils/chatTime';

export interface ReplyContext {
  id: string;
  senderName: string;
  preview: string;
}

export type SendPayload =
  | { type: 'text'; content: string; replyToId?: string | null }
  | { type: 'image'; mediaUrl: string; replyToId?: string | null }
  | { type: 'voice'; mediaUrl: string; durationSeconds: number; replyToId?: string | null };

interface MessageInputProps {
  onSend: (payload: SendPayload) => void | Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  conversationId?: string;
  userId?: string;
  replyContext?: ReplyContext | null;
  onCancelReply?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend, onTyping, disabled, conversationId, userId,
  replyContext, onCancelReply,
}) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const { checkRateLimit } = useRateLimit();
  const recorder = useVoiceRecorder();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      const rateLimitResult = await checkRateLimit('send_message', 50, 60);
      if (!rateLimitResult.success) return;

      const { data: sanitizedMessage, error } = await supabase.rpc('sanitize_message_content', {
        p_content: message,
      });
      if (error) throw new Error(error.message || 'Message validation failed');

      await onSend({ type: 'text', content: sanitizedMessage, replyToId: replyContext?.id ?? null });
      setMessage('');
      if (onTyping) { onTyping(false); setIsTyping(false); }
    } catch (error) {
      toast({
        title: "Invalid Message",
        description: error instanceof Error ? error.message : "Message contains invalid content",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (onTyping && !isTyping && e.target.value.length > 0) { onTyping(true); setIsTyping(true); }
    else if (onTyping && isTyping && e.target.value.length === 0) { onTyping(false); setIsTyping(false); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !conversationId) return;

    setIsUploading(true);
    try {
      const { validateSecureFile } = await import('@/utils/secureFileValidation');
      const validation = await validateSecureFile(file, 'image');
      if (!validation.isValid) throw new Error(validation.error);

      const { uploadChatMedia } = await import('@/utils/secureFileUpload');
      const result = await uploadChatMedia(file, userId, conversationId);
      if (result.error) throw new Error(result.error);

      await onSend({ type: 'image', mediaUrl: result.url!, replyToId: replyContext?.id ?? null });
    } catch (error) {
      toast({ title: "Upload Failed", description: error instanceof Error ? error.message : "Could not upload image", variant: "destructive" });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const startVoice = async () => {
    if (!userId || !conversationId) return;
    const started = await recorder.start();
    if (!started) {
      toast({
        title: 'Microphone unavailable',
        description: recorder.error || 'Allow microphone access to record voice notes.',
        variant: 'destructive',
      });
    }
  };

  const finishVoice = async () => {
    if (!userId || !conversationId) return;
    const rec = await recorder.stop();
    if (!rec) return;
    if (rec.durationSeconds < 1) {
      toast({ title: 'Too short', description: 'Hold to record a voice note.' });
      return;
    }
    setIsUploading(true);
    try {
      const { signedUrl } = await uploadVoiceNote(rec.blob, userId, conversationId, rec.mimeType);
      await onSend({
        type: 'voice',
        mediaUrl: signedUrl,
        durationSeconds: Math.round(rec.durationSeconds),
        replyToId: replyContext?.id ?? null,
      });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message || 'Could not send voice note', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const cancelVoice = async () => {
    await recorder.cancel();
  };

  return (
    <div className="bg-card border-t border-border p-4">
      {replyContext && (
        <div className="mb-2 flex items-start justify-between gap-2 rounded-lg bg-muted/60 border-l-4 border-primary px-3 py-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-primary">
              Replying to {replyContext.senderName}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {replyContext.preview}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cancel reply"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {recorder.isRecording ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={cancelVoice}
            className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center"
            aria-label="Cancel recording"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="flex-1 flex items-center gap-2 rounded-full bg-muted px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm tabular-nums text-muted-foreground">
              Recording · {formatVoiceDuration(recorder.durationSeconds)}
            </span>
          </div>
          <Button onClick={finishVoice} disabled={isUploading} size="icon" className="rounded-full">
            {isUploading
              ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              : <Send size={18} />}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 items-end">
          <label htmlFor="image-upload">
            <Button variant="ghost" size="icon" asChild>
              <span className="cursor-pointer"><ImageIcon size={20} /></span>
            </Button>
          </label>
          <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <Input
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 rounded-full"
            disabled={disabled || isUploading}
          />
          {message.trim().length > 0 ? (
            <Button onClick={handleSendMessage} disabled={disabled} size="icon" className="rounded-full">
              {isUploading
                ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                : <Send size={18} />}
            </Button>
          ) : (
            <Button
              onClick={startVoice}
              disabled={disabled || isUploading || !userId || !conversationId}
              size="icon"
              variant="ghost"
              aria-label="Record voice message"
              className="rounded-full"
            >
              <Mic size={20} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageInput;
