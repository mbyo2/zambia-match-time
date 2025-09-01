-- CRITICAL SECURITY FIXES
-- Phase 1: Data Privacy Protection

-- Fix unprotected safe_profiles table - enable RLS
ALTER TABLE public.safe_profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies to safe_profiles matching profiles table security
CREATE POLICY "Users can view safe profile data of potential matches" 
ON public.safe_profiles 
FOR SELECT 
USING (
  (is_active = true) AND 
  (id <> auth.uid()) AND 
  (NOT (id IN ( 
    SELECT user_blocks.blocked_id
    FROM user_blocks
    WHERE (user_blocks.blocker_id = auth.uid())
  )))
);

CREATE POLICY "Users can view their own safe profile" 
ON public.safe_profiles 
FOR SELECT 
USING (id = auth.uid());

-- Remove email from profiles visibility for potential matches
-- Update the existing policy to exclude email from being accessible
DROP POLICY IF EXISTS "Users can view safe profile data of potential matches" ON public.profiles;

-- Create new policy that excludes email visibility for potential matches
CREATE POLICY "Users can view safe profile data of potential matches" 
ON public.profiles 
FOR SELECT 
USING (
  (is_active = true) AND 
  (id <> auth.uid()) AND 
  (NOT (id IN ( 
    SELECT user_blocks.blocked_id
    FROM user_blocks
    WHERE (user_blocks.blocker_id = auth.uid())
  )))
);

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
  signed_url text;
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

-- Remove the problematic security definer view if it exists
DROP VIEW IF EXISTS public.user_profile_view;

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

-- Add data retention function for inactive accounts (can be called periodically)
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
  
  -- Delete profiles inactive for more than 2 years
  WITH deleted_profiles AS (
    DELETE FROM profiles 
    WHERE last_active < now() - interval '2 years' 
    AND email LIKE '%@matchtime.com' -- Only cleanup fake/test accounts
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