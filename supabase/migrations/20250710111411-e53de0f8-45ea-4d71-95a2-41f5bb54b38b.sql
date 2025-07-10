-- Create admin function to manage fake users and make user admin
CREATE OR REPLACE FUNCTION make_user_admin(user_email text)
RETURNS void AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get the user ID from the email
  SELECT id INTO target_user_id FROM profiles WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Insert admin role
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up fake users
CREATE OR REPLACE FUNCTION cleanup_fake_users()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete fake users and cascade will handle related data
  DELETE FROM profiles WHERE email LIKE '%@matchtime.com';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get app statistics
CREATE OR REPLACE FUNCTION get_app_statistics()
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'real_users', (SELECT COUNT(*) FROM profiles WHERE email NOT LIKE '%@matchtime.com'),
    'fake_users', (SELECT COUNT(*) FROM profiles WHERE email LIKE '%@matchtime.com'),
    'total_matches', (SELECT COUNT(*) FROM matches),
    'total_messages', (SELECT COUNT(*) FROM messages),
    'active_users_7d', (SELECT COUNT(*) FROM profiles WHERE last_active > now() - interval '7 days'),
    'users_with_photos', (SELECT COUNT(DISTINCT user_id) FROM profile_photos),
    'total_swipes', (SELECT COUNT(*) FROM swipes)
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make the default admin account have admin role
INSERT INTO profiles (id, email, first_name, last_name, date_of_birth, gender)
SELECT gen_random_uuid(), 'admin@justgrown.com', 'Admin', 'User', '1990-01-01', 'other'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@justgrown.com');

-- Add admin role for the default admin
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM profiles
WHERE email = 'admin@justgrown.com'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  JOIN profiles p ON ur.user_id = p.id 
  WHERE p.email = 'admin@justgrown.com' AND ur.role = 'admin'
);

-- Create triggers for automatic user stats creation
CREATE OR REPLACE FUNCTION create_user_stats_on_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create user stats
DROP TRIGGER IF EXISTS create_stats_on_profile ON profiles;
CREATE TRIGGER create_stats_on_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_stats_on_profile();

-- Create trigger to update last_active on swipe
CREATE OR REPLACE FUNCTION update_last_active_on_swipe()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET last_active = now()
  WHERE id = NEW.swiper_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_active_swipe
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active_on_swipe();

-- Create trigger to update last_active on message
CREATE OR REPLACE FUNCTION update_last_active_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET last_active = now()
  WHERE id = NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_active_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active_on_message();