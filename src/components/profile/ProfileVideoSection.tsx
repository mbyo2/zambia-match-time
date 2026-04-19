import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Video as VideoIcon, Trash2, Upload } from 'lucide-react';
import { logger } from '@/utils/logger';

interface ProfileVideo {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
}

const MAX_VIDEOS = 2;
const MAX_DURATION_SEC = 15;
const MAX_SIZE_MB = 50;

const ProfileVideoSection: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) fetchVideos();
  }, [user]);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('profile_videos')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true });
    if (error) { logger.error('Fetch videos error:', error); return; }
    setVideos(data || []);
  };

  const validateVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(v.duration);
      };
      v.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read video')); };
      v.src = url;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (videos.length >= MAX_VIDEOS) {
      toast({ title: 'Limit reached', description: `Max ${MAX_VIDEOS} videos. Delete one first.`, variant: 'destructive' });
      return;
    }
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
      toast({ title: 'Invalid format', description: 'Use MP4, WebM, or MOV', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: 'Too large', description: `Max ${MAX_SIZE_MB}MB`, variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    setProgress(10);

    try {
      const duration = await validateVideoDuration(file);
      if (duration > MAX_DURATION_SEC + 0.5) {
        toast({ title: 'Too long', description: `Videos must be ${MAX_DURATION_SEC}s or less`, variant: 'destructive' });
        setIsUploading(false);
        return;
      }
      setProgress(30);

      const ext = file.name.split('.').pop() || 'mp4';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('profile-videos')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      setProgress(80);

      const { data: { publicUrl } } = supabase.storage.from('profile-videos').getPublicUrl(path);
      const { error: insErr, data } = await supabase
        .from('profile_videos')
        .insert({ user_id: user.id, video_url: publicUrl, duration_seconds: Math.round(duration) })
        .select()
        .single();
      if (insErr) throw insErr;

      setVideos(prev => [...prev, data as ProfileVideo]);
      setProgress(100);
      toast({ title: 'Video uploaded', description: 'Your loop is live ✨' });
    } catch (err) {
      logger.error('Video upload error:', err);
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : 'Try again', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 800);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteVideo = async (video: ProfileVideo) => {
    try {
      const url = new URL(video.video_url);
      const idx = url.pathname.indexOf('/profile-videos/');
      const path = idx >= 0 ? url.pathname.substring(idx + '/profile-videos/'.length) : null;
      if (path) await supabase.storage.from('profile-videos').remove([decodeURIComponent(path)]);
      const { error } = await supabase.from('profile_videos').delete().eq('id', video.id);
      if (error) throw error;
      setVideos(prev => prev.filter(v => v.id !== video.id));
      toast({ title: 'Deleted' });
    } catch (err) {
      logger.error('Delete video error:', err);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <VideoIcon size={20} /> Profile Videos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Add up to {MAX_VIDEOS} short loops ({MAX_DURATION_SEC}s max). Shown first in your card.
        </p>
        {isUploading && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm"><span>Uploading...</span><span>{progress}%</span></div>
            <Progress value={progress} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {videos.map(v => (
            <div key={v.id} className="relative group">
              <video
                src={v.video_url}
                className="w-full aspect-[3/4] object-cover rounded-lg bg-muted"
                muted
                loop
                playsInline
                preload="metadata"
                onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
              />
              {v.duration_seconds && (
                <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                  {v.duration_seconds}s
                </span>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteVideo(v)}
                className="absolute top-2 right-2 h-7 w-7 p-0"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}

          {videos.length < MAX_VIDEOS && (
            <label className="border-2 border-dashed border-border rounded-lg aspect-[3/4] flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
              <div className="text-center px-2">
                <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add Video</span>
                <p className="text-xs text-muted-foreground mt-1">{MAX_DURATION_SEC}s · {MAX_SIZE_MB}MB max</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileVideoSection;
