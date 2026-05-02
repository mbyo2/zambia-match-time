
CREATE OR REPLACE FUNCTION public.notify_incoming_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  caller_name text;
BEGIN
  SELECT first_name INTO caller_name FROM public.profiles WHERE id = NEW.caller_id;
  PERFORM public.create_notification(
    NEW.callee_id,
    'incoming_call',
    'Incoming ' || NEW.call_type::text || ' call',
    COALESCE(caller_name, 'Someone') || ' is calling you',
    NEW.caller_id,
    NEW.match_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_incoming_call ON public.calls;
CREATE TRIGGER trg_notify_incoming_call
AFTER INSERT ON public.calls
FOR EACH ROW
WHEN (NEW.status = 'ringing')
EXECUTE FUNCTION public.notify_incoming_call();
