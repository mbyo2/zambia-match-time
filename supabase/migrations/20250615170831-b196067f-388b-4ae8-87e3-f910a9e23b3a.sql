
-- Create ENUM types for roles and accommodation types
CREATE TYPE public.app_role AS ENUM ('lodge_manager');
CREATE TYPE public.accommodation_type AS ENUM ('hotel', 'apartment', 'resort', 'villa', 'cabin');

-- Create a table to assign roles to users
CREATE TABLE public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create a table to store accommodation details
CREATE TABLE public.accommodations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    type public.accommodation_type NOT NULL,
    location_city text,
    location_country text,
    price_per_night numeric(10, 2) NOT NULL,
    image_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add Row Level Security policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles." ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accommodations are public to view." ON public.accommodations FOR SELECT USING (true);

-- Create a helper function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = p_user_id AND role = p_role
    );
$$;

-- Add policies for lodge managers to manage accommodations
CREATE POLICY "Lodge managers can create accommodations." ON public.accommodations FOR INSERT WITH CHECK (owner_id = auth.uid() AND has_role(auth.uid(), 'lodge_manager'));
CREATE POLICY "Lodge managers can update their own accommodations." ON public.accommodations FOR UPDATE USING (owner_id = auth.uid() AND has_role(auth.uid(), 'lodge_manager'));
CREATE POLICY "Lodge managers can delete their own accommodations." ON public.accommodations FOR DELETE USING (owner_id = auth.uid() AND has_role(auth.uid(), 'lodge_manager'));
