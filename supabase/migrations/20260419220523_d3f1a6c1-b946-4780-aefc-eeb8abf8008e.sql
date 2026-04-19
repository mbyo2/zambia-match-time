-- Create profile-videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-videos',
  'profile-videos',
  true,
  52428800, -- 50MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for profile-videos
CREATE POLICY "Profile videos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-videos');

CREATE POLICY "Users can upload their own profile videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);