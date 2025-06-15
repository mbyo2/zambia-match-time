
-- Add columns to support professional verification
ALTER TABLE public.verification_requests
ADD COLUMN verification_type TEXT NOT NULL DEFAULT 'identity',
ADD COLUMN profession TEXT,
ADD COLUMN professional_document_url TEXT;

-- Add column to profiles to display the badge
ALTER TABLE public.profiles
ADD COLUMN professional_badge TEXT;
