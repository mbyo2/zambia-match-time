
-- Create a table to store events
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location_city TEXT,
  location_country TEXT,
  category TEXT,
  image_url TEXT
);

-- Enable Row Level Security for the events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows any authenticated user to read events
CREATE POLICY "Allow authenticated users to read events"
ON public.events
FOR SELECT
TO authenticated
USING (true);

-- Insert some sample events to display in the app
INSERT INTO public.events (name, description, event_date, location_city, location_country, category, image_url)
VALUES
  ('Lusaka July Festival', 'Annual cultural and music festival. A great place to meet new people and have fun!', '2025-07-26 10:00:00+02', 'Lusaka', 'Zambia', 'Festival', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974&auto=format&fit=crop'),
  ('Sunday Church Gathering', 'Join us for our weekly service. A welcoming community for all.', '2025-06-22 11:00:00+02', 'Lusaka', 'Zambia', 'Church', 'https://images.unsplash.com/photo-1507914322495-2533b3a6003b?q=80&w=2070&auto=format&fit=crop'),
  ('Community Market Day', 'Explore local crafts, food, and music. Held every first Saturday of the month.', '2025-07-05 09:00:00+02', 'Ndola', 'Zambia', 'Community', 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=2070&auto=format&fit=crop'),
  ('Charity Fun Run', '5k run to support local schools. All fitness levels welcome!', '2025-08-16 08:00:00+02', 'Kitwe', 'Zambia', 'Community', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop');
