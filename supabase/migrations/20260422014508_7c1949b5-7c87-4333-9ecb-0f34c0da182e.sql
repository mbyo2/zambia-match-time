-- Idempotent conversation creation for a match.
-- Uses a transaction-scoped advisory lock keyed on match_id so concurrent
-- callers serialize and only one row is ever inserted per match.
CREATE OR REPLACE FUNCTION public.get_or_create_conversation_for_match(p_match_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  conv_id uuid;
  is_member boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- Authorize: caller must belong to the match
  SELECT EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = p_match_id
      AND (m.user1_id = uid OR m.user2_id = uid)
      AND m.is_active = true
  ) INTO is_member;

  IF NOT is_member THEN
    RAISE EXCEPTION 'not_a_match_member';
  END IF;

  -- Fast path: conversation already exists
  SELECT id INTO conv_id FROM public.conversations WHERE match_id = p_match_id LIMIT 1;
  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- Serialize concurrent creators on this match using an advisory lock
  PERFORM pg_advisory_xact_lock(hashtextextended(p_match_id::text, 0));

  -- Re-check after acquiring the lock
  SELECT id INTO conv_id FROM public.conversations WHERE match_id = p_match_id LIMIT 1;
  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  INSERT INTO public.conversations (match_id)
  VALUES (p_match_id)
  RETURNING id INTO conv_id;

  RETURN conv_id;
END;
$function$;