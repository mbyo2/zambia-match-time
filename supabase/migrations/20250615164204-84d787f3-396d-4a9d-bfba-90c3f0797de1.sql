
-- Add columns to reports table to support flagging specific content like photos
ALTER TABLE public.reports ADD COLUMN content_type TEXT NOT NULL DEFAULT 'profile';
ALTER TABLE public.reports ADD COLUMN content_metadata JSONB;
