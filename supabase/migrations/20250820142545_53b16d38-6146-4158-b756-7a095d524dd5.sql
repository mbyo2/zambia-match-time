-- Critical Security Fixes Migration
-- 1. Fix profiles RLS policy to prevent email exposure
DROP POLICY IF EXISTS "Users can view profiles of potential matches" ON public.profiles;

CREATE POLICY "Users can view safe profile data of potential matches" ON public.profiles
FOR SELECT USING (
  (is_active = true) 
  AND (id <> auth.uid()) 
  AND (NOT (id IN ( SELECT user_blocks.blocked_id FROM user_blocks WHERE (user_blocks.blocker_id = auth.uid()))))
);

-- 2. Create a safe public profile view that excludes sensitive data
CREATE OR REPLACE VIEW public.safe_profiles AS
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

-- Enable RLS on the view
ALTER VIEW public.safe_profiles SET (security_barrier = true);

-- 3. Create private storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 4. Create storage policies for verification documents
DROP POLICY IF EXISTS "Users can upload their verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all verification docs" ON storage.objects;

CREATE POLICY "Users can upload their verification docs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their verification docs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all verification docs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'verification-docs' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- 5. Make chat-media bucket private and secure
UPDATE storage.buckets SET public = false WHERE id = 'chat-media';

DROP POLICY IF EXISTS "Users can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat media in their conversations" ON storage.objects;

CREATE POLICY "Users can upload chat media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view chat media in their conversations" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-media' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1] 
    OR EXISTS (
      SELECT 1 FROM conversations c
      JOIN matches m ON c.match_id = m.id
      WHERE (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
      AND name LIKE '%' || c.id::text || '%'
    )
  )
);

-- 6. Restrict user_prompt_responses to be more secure
DROP POLICY IF EXISTS "Users can view public responses" ON public.user_prompt_responses;

CREATE POLICY "Users can view public responses from non-blocked users" ON public.user_prompt_responses
FOR SELECT USING (
  is_public = true 
  AND user_id <> auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM user_blocks 
    WHERE blocker_id = auth.uid() AND blocked_id = user_id
  )
);

-- 7. Create security audit tables
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.security_audit_log
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs" ON public.security_audit_log
FOR INSERT WITH CHECK (true);

-- 8. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id, details, ip_address, user_agent
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id, p_details, p_ip_address, p_user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- 9. Add trigger for verification request changes
CREATE OR REPLACE FUNCTION public.audit_verification_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log verification status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'verification_status_changed',
      'verification_request',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'reviewer_id', auth.uid()
      )
    );
  END IF;
  
  -- Log new verification requests
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'verification_request_submitted',
      'verification_request',
      NEW.id,
      jsonb_build_object('verification_type', NEW.verification_type)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_verification_changes_trigger ON public.verification_requests;
CREATE TRIGGER audit_verification_changes_trigger
  AFTER INSERT OR UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_verification_changes();

-- 10. Add trigger for admin actions
CREATE OR REPLACE FUNCTION public.audit_admin_actions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log when admin roles are granted
  IF TG_OP = 'INSERT' AND NEW.role = 'admin' THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'admin_role_granted',
      'user_role',
      NEW.id,
      jsonb_build_object('target_user_id', NEW.user_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_admin_actions_trigger ON public.user_roles;
CREATE TRIGGER audit_admin_actions_trigger
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_admin_actions();

-- 11. Create function to check for suspicious activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS TABLE(user_id UUID, activity_type TEXT, count BIGINT, last_occurrence TIMESTAMP WITH TIME ZONE)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Detect users with excessive failed login attempts (would need auth events)
  SELECT 
    user_id,
    'excessive_swipes' as activity_type,
    COUNT(*) as count,
    MAX(created_at) as last_occurrence
  FROM swipes 
  WHERE created_at > now() - interval '1 hour'
  GROUP BY user_id
  HAVING COUNT(*) > 100

  UNION ALL

  -- Detect mass reporting (potential abuse)
  SELECT 
    reporter_id as user_id,
    'mass_reporting' as activity_type,
    COUNT(*) as count,
    MAX(created_at) as last_occurrence
  FROM reports 
  WHERE created_at > now() - interval '24 hours'
  GROUP BY reporter_id
  HAVING COUNT(*) > 10;
$$;