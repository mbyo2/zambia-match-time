DO $$ BEGIN
  CREATE TYPE public.call_type AS ENUM ('audio', 'video');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.call_status AS ENUM ('ringing','accepted','declined','missed','ended','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  caller_id uuid NOT NULL,
  callee_id uuid NOT NULL,
  call_type public.call_type NOT NULL DEFAULT 'audio',
  status public.call_status NOT NULL DEFAULT 'ringing',
  started_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calls_callee ON public.calls(callee_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_caller ON public.calls(caller_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_match  ON public.calls(match_id, started_at DESC);

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view their calls" ON public.calls;
CREATE POLICY "Participants can view their calls"
ON public.calls FOR SELECT TO authenticated
USING (caller_id = auth.uid() OR callee_id = auth.uid());

DROP POLICY IF EXISTS "Caller can create calls between matched users" ON public.calls;
CREATE POLICY "Caller can create calls between matched users"
ON public.calls FOR INSERT TO authenticated
WITH CHECK (
  caller_id = auth.uid()
  AND public.users_are_matched(caller_id, callee_id)
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id AND m.is_active = true
      AND ((m.user1_id = caller_id AND m.user2_id = callee_id)
        OR (m.user2_id = caller_id AND m.user1_id = callee_id))
  )
);

DROP POLICY IF EXISTS "Participants can update their calls" ON public.calls;
CREATE POLICY "Participants can update their calls"
ON public.calls FOR UPDATE TO authenticated
USING (caller_id = auth.uid() OR callee_id = auth.uid());

DROP TRIGGER IF EXISTS trg_calls_updated_at ON public.calls;
CREATE TRIGGER trg_calls_updated_at
BEFORE UPDATE ON public.calls
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.calls REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;