CREATE OR REPLACE FUNCTION public.fuzz_distance(exact_distance double precision)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN exact_distance + (random() * 7 - 2);
END;
$$;