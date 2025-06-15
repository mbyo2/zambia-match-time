
-- 1. Create an ENUM type for application roles
CREATE TYPE public.app_role AS ENUM ('lodge_manager', 'user');

-- 2. Create a table to store user roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
COMMENT ON TABLE public.user_roles IS 'Stores roles for users, like lodge manager.';

-- 3. Enable RLS for user_roles and add a policy for users to see their own roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Create a helper function to check a user's role. This is essential for other RLS policies.
CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id AND role = p_role
  );
END;
$$;

-- 5. Create an ENUM type for accommodation types
CREATE TYPE public.accommodation_type AS ENUM ('Lodge', 'Hotel', 'Guest House', 'Apartment', 'Other');

-- 6. Create accommodations table
CREATE TABLE public.accommodations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    type public.accommodation_type NOT NULL DEFAULT 'Lodge',
    location_address TEXT,
    location_city TEXT,
    location_country TEXT,
    price_per_night NUMERIC(10, 2),
    booking_url TEXT,
    image_url TEXT,
    manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.accommodations IS 'Stores accommodation details like lodges and hotels.';

-- 7. Setup RLS for accommodations
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all accommodations"
ON public.accommodations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Lodge managers can create accommodations for themselves"
ON public.accommodations FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'lodge_manager') AND manager_id = auth.uid());

CREATE POLICY "Lodge managers can update their own accommodations"
ON public.accommodations FOR UPDATE
TO authenticated
USING (auth.uid() = manager_id)
WITH CHECK (public.has_role(auth.uid(), 'lodge_manager'));

CREATE POLICY "Lodge managers can delete their own accommodations"
ON public.accommodations FOR DELETE
TO authenticated
USING (auth.uid() = manager_id);

-- 8. Create a linking table for event accommodations recommendations
CREATE TABLE public.event_accommodations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    accommodation_id UUID NOT NULL REFERENCES public.accommodations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (event_id, accommodation_id)
);
COMMENT ON TABLE public.event_accommodations IS 'Links events to recommended accommodations.';

-- 9. Setup RLS for event_accommodations
ALTER TABLE public.event_accommodations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view event accommodation links"
ON public.event_accommodations FOR SELECT
TO authenticated
USING (true);

-- 10. Insert some sample accommodations
INSERT INTO public.accommodations (name, description, type, location_city, location_country, price_per_night, image_url, booking_url)
VALUES
  ('The Lusaka Grand Hotel', 'A luxurious hotel in the heart of Lusaka, perfect for festival goers.', 'Hotel', 'Lusaka', 'Zambia', 250.00, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop', '#'),
  ('Zambezi Lodge', 'A cozy lodge with a traditional touch, offering comfort and tranquility.', 'Lodge', 'Lusaka', 'Zambia', 120.50, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1949&auto=format&fit=crop', '#'),
  ('Ndola City Apartments', 'Modern and spacious apartments for a home-away-from-home experience.', 'Apartment', 'Ndola', 'Zambia', 95.00, 'https://images.unsplash.com/photo-1499955085172-a104c9463ece?q=80&w=2070&auto=format&fit=crop', '#');

-- 11. Link some accommodations to events
INSERT INTO public.event_accommodations (event_id, accommodation_id)
SELECT e.id, a.id
FROM public.events e, public.accommodations a
WHERE e.name = 'Lusaka July Festival' AND a.name = 'The Lusaka Grand Hotel';

INSERT INTO public.event_accommodations (event_id, accommodation_id)
SELECT e.id, a.id
FROM public.events e, public.accommodations a
WHERE e.name = 'Lusaka July Festival' AND a.name = 'Zambezi Lodge';

INSERT INTO public.event_accommodations (event_id, accommodation_id)
SELECT e.id, a.id
FROM public.events e, public.accommodations a
WHERE e.name = 'Community Market Day' AND a.name = 'Ndola City Apartments';
