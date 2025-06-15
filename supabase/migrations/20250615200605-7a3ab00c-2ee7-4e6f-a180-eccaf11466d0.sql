
-- Add accommodation availability field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN has_accommodation_available boolean DEFAULT false;

-- Add a comment to document the field
COMMENT ON COLUMN public.profiles.has_accommodation_available IS 'Indicates if the user has accommodation available to offer';
