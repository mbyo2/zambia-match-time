-- Fix security linter warnings
-- 1. Remove SECURITY DEFINER from safe_profiles view
DROP VIEW IF EXISTS public.safe_profiles;

CREATE VIEW public.safe_profiles AS
SELECT 
  id,
  first_name,
  date_of_birth,
  gender,
  interested_in,
  education,
  location_city,
  location_state,
  max_distance,
  age_min,
  age_max,
  relationship_goals,
  height_cm,
  verification_status,
  is_active,
  last_active,
  has_accommodation_available,
  personality_traits,
  compatibility_score,
  bio,
  occupation,
  professional_badge,
  body_type,
  ethnicity,
  religion,
  interests,
  smoking,
  drinking,
  looking_for,
  created_at,
  updated_at
FROM public.profiles
WHERE is_active = true AND id <> auth.uid();