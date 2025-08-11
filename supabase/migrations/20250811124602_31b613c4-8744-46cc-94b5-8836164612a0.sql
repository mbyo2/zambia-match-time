
-- Create a function to automatically grant admin privileges to the developer account
CREATE OR REPLACE FUNCTION public.setup_developer_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Grant admin role to the developer account (admin@justgrown.com)
  INSERT INTO public.user_roles (user_id, role)
  SELECT p.id, 'admin'::app_role
  FROM public.profiles p
  WHERE p.email = 'admin@justgrown.com'
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update subscription to premium for developer account
  INSERT INTO public.user_subscriptions (user_id, tier, status)
  SELECT p.id, 'premium'::subscription_tier, 'active'
  FROM public.profiles p
  WHERE p.email = 'admin@justgrown.com'
  ON CONFLICT (user_id) DO UPDATE SET
    tier = 'premium'::subscription_tier,
    status = 'active',
    updated_at = now();
END;
$$;

-- Execute the setup function
SELECT public.setup_developer_admin();

-- Create a function to check if user is super admin (developer)
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE p.id = user_id 
    AND p.email = 'admin@justgrown.com'
    AND ur.role = 'admin'
  );
$$;

-- Update RLS policies for admin access to accommodate super admin
CREATE POLICY "Super admin can view all reports" 
ON public.reports 
FOR SELECT 
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin can update all reports" 
ON public.reports 
FOR UPDATE 
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Allow super admin to manage user roles
CREATE POLICY "Super admin can manage user roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin can insert user roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));
