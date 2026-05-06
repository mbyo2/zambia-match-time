CREATE TABLE IF NOT EXISTS public.client_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can insert their own error reports; nobody can read except admins.
CREATE POLICY "Anyone can log errors"
ON public.client_error_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read error logs"
ON public.client_error_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_client_error_logs_created_at ON public.client_error_logs (created_at DESC);