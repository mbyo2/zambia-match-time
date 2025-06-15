
-- Create ENUM type for gender if it doesn't exist.
-- This is needed for the 'gender' column in the 'profiles' table.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
        CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'non_binary', 'other');
    END IF;
END$$;

-- Create a public bucket for profile photos if it doesn't already exist.
-- The generated photos for the fake users will be stored here.
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Add Row Level Security (RLS) policies for the profile photos bucket.
-- This will make photos public to view, but only allow authenticated users to manage their own.
DROP POLICY IF EXISTS "Public read access for profile photos" ON storage.objects;
CREATE POLICY "Public read access for profile photos"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'profile-photos' );

DROP POLICY IF EXISTS "Authenticated users can manage their own photos" ON storage.objects;
CREATE POLICY "Authenticated users can manage their own photos"
ON storage.objects FOR ALL
TO authenticated
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

-- This function automatically creates a new row in public.profiles for each new user.
-- It uses data from the user's metadata to populate the profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, date_of_birth, gender)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'first_name', 'New'),
    COALESCE(new.raw_user_meta_data ->> 'last_name', 'User'),
    COALESCE((new.raw_user_meta_data ->> 'date_of_birth')::date, '2000-01-01'),
    COALESCE((new.raw_user_meta_data ->> 'gender')::gender_type, 'other')
  );
  RETURN new;
END;
$$;

-- This trigger calls the handle_new_user function every time a new user is created in auth.users.
DO $$
BEGIN
   IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created' AND tgrelid = 'auth.users'::regclass) THEN
      DROP TRIGGER on_auth_user_created ON auth.users;
   END IF;
END
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
