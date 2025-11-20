-- Fix the fuzz_distance function that's missing
-- This function adds random noise to distances to prevent triangulation attacks
CREATE OR REPLACE FUNCTION public.fuzz_distance(exact_distance numeric)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Add random noise between -2km and +5km to prevent triangulation
  RETURN exact_distance + (random() * 7 - 2);
END;
$$;