-- Backfill all existing fake profiles (matchtime.com emails) with Lusaka coordinates
UPDATE public.profiles 
SET 
  location_city = 'Lusaka',
  location_state = 'Lusaka Province',
  location_lat = -15.3875 + (random() - 0.5) * 0.15,
  location_lng = 28.3228 + (random() - 0.5) * 0.15
WHERE email LIKE '%@matchtime.com'
  AND (location_lat IS NULL OR location_lng IS NULL);