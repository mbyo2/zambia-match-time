-- CRITICAL SECURITY FIXES (CORRECTED)
-- Phase 1: Data Privacy Protection

-- Drop the unsafe safe_profiles view
DROP VIEW IF EXISTS public.safe_profiles;

-- Create a secure function to get safe profile data instead
CREATE OR REPLACE FUNCTION public.get_safe_profiles_for_user(user_uuid uuid)
RETURNS TABLE(
  id uuid,
  first_name text,
  bio text,
  occupation text,
  education education_level,
  location_city text,
  location_state text,
  date_of_birth date,
  height_cm integer,
  interests text[],
  relationship_goals relationship_goal[],
  is_active boolean,
  last_active timestamp with time zone,
  has_accommodation_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only return data for authenticated users viewing other profiles
  IF auth.uid() IS NULL OR auth.uid() = user_uuid THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.bio,
    p.occupation,
    p.education,
    p.location_city,
    p.location_state,
    p.date_of_birth,
    p.height_cm,
    p.interests,
    p.relationship_goals,
    p.is_active,
    p.last_active,
    p.has_accommodation_available
  FROM profiles p
  WHERE p.id = user_uuid
    AND p.is_active = true
    AND p.id <> auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks 
      WHERE blocker_id = auth.uid() AND blocked_id = p.id
    );
END;
$$;

-- Phase 2: Verification Document Security

-- Create function for secure verification document access (admin only)
CREATE OR REPLACE FUNCTION public.get_verification_document_url(
  p_request_id uuid,
  p_document_type text DEFAULT 'selfie'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  doc_path text;
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Get document path based on type
  SELECT 
    CASE 
      WHEN p_document_type = 'professional' THEN professional_document_url
      ELSE selfie_url
    END
  INTO doc_path
  FROM verification_requests 
  WHERE id = p_request_id;
  
  IF doc_path IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Log access for audit
  PERFORM public.log_security_event(
    auth.uid(),
    'verification_document_accessed',
    'verification_request',
    p_request_id,
    jsonb_build_object(
      'document_type', p_document_type,
      'document_path', doc_path
    )
  );
  
  RETURN doc_path;
END;
$$;

-- Phase 3: Authentication Hardening

-- Create secure function to check user subscription status
CREATE OR REPLACE FUNCTION public.get_current_user_subscription()
RETURNS subscription_tier
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT tier FROM public.user_subscriptions 
     WHERE user_id = auth.uid() 
     AND status = 'active' 
     AND (current_period_end IS NULL OR current_period_end > NOW())
     ORDER BY created_at DESC 
     LIMIT 1),
    'free'::subscription_tier
  );
$$;

-- Phase 4: Data Minimization

-- Restrict user prompt responses to authenticated users only
DROP POLICY IF EXISTS "Users can view public responses from non-blocked users" ON public.user_prompt_responses;

CREATE POLICY "Authenticated users can view public responses from non-blocked users" 
ON public.user_prompt_responses 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  (is_public = true) AND 
  (user_id <> auth.uid()) AND 
  (NOT (EXISTS ( 
    SELECT 1
    FROM user_blocks
    WHERE ((user_blocks.blocker_id = auth.uid()) AND (user_blocks.blocked_id = user_prompt_responses.user_id))
  )))
);

-- Add data retention function for inactive accounts
CREATE OR REPLACE FUNCTION public.cleanup_inactive_accounts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  cleanup_count integer := 0;
BEGIN
  -- Only super admins can run cleanup
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  -- Delete profiles inactive for more than 2 years (fake accounts only)
  WITH deleted_profiles AS (
    DELETE FROM profiles 
    WHERE last_active < now() - interval '2 years' 
    AND email LIKE '%@matchtime.com'
    RETURNING id
  )
  SELECT count(*) INTO cleanup_count FROM deleted_profiles;
  
  -- Log the cleanup action
  PERFORM public.log_security_event(
    auth.uid(),
    'inactive_accounts_cleanup',
    'profiles',
    null,
    jsonb_build_object('cleaned_count', cleanup_count)
  );
  
  RETURN cleanup_count;
END;
$$;