
-- Add new columns to profiles for enhanced matching
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS body_type text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ethnicity text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS religion text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS smoking text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS drinking text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS looking_for text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_traits jsonb DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS compatibility_score integer DEFAULT 0;

-- Create user_stats table for gamification
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  level integer DEFAULT 1,
  experience_points integer DEFAULT 0,
  login_streak integer DEFAULT 0,
  last_login_date date DEFAULT CURRENT_DATE,
  total_matches integer DEFAULT 0,
  total_conversations integer DEFAULT 0,
  profile_views integer DEFAULT 0,
  likes_given integer DEFAULT 0,
  likes_received integer DEFAULT 0,
  super_likes_given integer DEFAULT 0,
  super_likes_received integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL, -- 'matches', 'login_streak', 'conversations', etc.
  requirement_value integer NOT NULL,
  points_reward integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  achievement_id uuid REFERENCES achievements(id) NOT NULL,
  earned_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create daily_rewards table
CREATE TABLE IF NOT EXISTS daily_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  reward_date date DEFAULT CURRENT_DATE,
  reward_type text NOT NULL, -- 'super_like', 'boost', 'points'
  reward_value integer DEFAULT 1,
  claimed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, reward_date)
);

-- Create icebreaker_prompts table
CREATE TABLE IF NOT EXISTS icebreaker_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text text NOT NULL,
  category text NOT NULL, -- 'fun', 'deep', 'flirty', 'hobby'
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_prompt_responses table
CREATE TABLE IF NOT EXISTS user_prompt_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  prompt_id uuid REFERENCES icebreaker_prompts(id) NOT NULL,
  response_text text NOT NULL,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, prompt_id)
);

-- Create stories table for status updates
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  content_type text NOT NULL, -- 'photo', 'video', 'text'
  content_url text,
  text_content text,
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
  views_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Create story_views table
CREATE TABLE IF NOT EXISTS story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) NOT NULL,
  viewer_id uuid REFERENCES profiles(id) NOT NULL,
  viewed_at timestamp with time zone DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Create virtual_gifts table
CREATE TABLE IF NOT EXISTS virtual_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text NOT NULL,
  price_in_points integer NOT NULL,
  rarity text DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create gift_transactions table
CREATE TABLE IF NOT EXISTS gift_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  receiver_id uuid REFERENCES profiles(id) NOT NULL,
  gift_id uuid REFERENCES virtual_gifts(id) NOT NULL,
  message text,
  conversation_id uuid REFERENCES conversations(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Create boosts table for profile boosting
CREATE TABLE IF NOT EXISTS boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  boost_type text NOT NULL, -- 'profile', 'super_like', 'prime_time'
  started_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE icebreaker_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompt_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;

-- User stats policies
CREATE POLICY "Users can view their own stats" ON user_stats FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own stats" ON user_stats FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own stats" ON user_stats FOR INSERT WITH CHECK (user_id = auth.uid());

-- Achievements policies
CREATE POLICY "Everyone can view achievements" ON achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can earn achievements" ON user_achievements FOR INSERT WITH CHECK (user_id = auth.uid());

-- Daily rewards policies
CREATE POLICY "Users can view their own rewards" ON daily_rewards FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can claim their rewards" ON daily_rewards FOR UPDATE USING (user_id = auth.uid());

-- Icebreaker prompts policies
CREATE POLICY "Everyone can view active prompts" ON icebreaker_prompts FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Users can manage their responses" ON user_prompt_responses FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view public responses" ON user_prompt_responses FOR SELECT TO authenticated USING (is_public = true);

-- Stories policies
CREATE POLICY "Users can manage their stories" ON stories FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view unexpired stories" ON stories FOR SELECT TO authenticated USING (expires_at > now());
CREATE POLICY "Users can view stories" ON story_views FOR SELECT USING (viewer_id = auth.uid());
CREATE POLICY "Users can record story views" ON story_views FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- Virtual gifts policies
CREATE POLICY "Everyone can view active gifts" ON virtual_gifts FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Users can send gifts" ON gift_transactions FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can view their gift transactions" ON gift_transactions FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Boosts policies
CREATE POLICY "Users can manage their boosts" ON boosts FOR ALL USING (user_id = auth.uid());

-- Insert sample achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, points_reward) VALUES
('First Match', 'Get your first match!', '🎯', 'matches', 1, 100),
('Conversation Starter', 'Start 5 conversations', '💬', 'conversations', 5, 200),
('Week Warrior', 'Login for 7 days straight', '🔥', 'login_streak', 7, 300),
('Popular Profile', 'Get 100 profile views', '👀', 'profile_views', 100, 500),
('Super Liked', 'Receive 10 super likes', '⭐', 'super_likes_received', 10, 400);

-- Insert sample icebreaker prompts
INSERT INTO icebreaker_prompts (prompt_text, category) VALUES
('Two truths and a lie about me:', 'fun'),
('My biggest adventure was:', 'fun'),
('I''m passionate about:', 'deep'),
('My ideal weekend involves:', 'lifestyle'),
('The best advice I''ve received:', 'deep'),
('My guilty pleasure is:', 'fun'),
('I''m looking for someone who:', 'relationship'),
('My favorite way to unwind:', 'lifestyle');

-- Insert sample virtual gifts
INSERT INTO virtual_gifts (name, description, icon_url, price_in_points, rarity) VALUES
('Rose', 'A beautiful rose', '🌹', 50, 'common'),
('Heart', 'Show your love', '❤️', 100, 'common'),
('Diamond', 'You''re precious', '💎', 500, 'rare'),
('Crown', 'You''re royalty', '👑', 1000, 'epic'),
('Unicorn', 'You''re magical', '🦄', 2000, 'legendary');

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialize stats if they don't exist
  INSERT INTO user_stats (user_id) 
  VALUES (NEW.id) 
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new profiles
CREATE TRIGGER initialize_user_stats
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(p_user_id uuid)
RETURNS void AS $$
DECLARE
  user_stat RECORD;
  achievement RECORD;
BEGIN
  -- Get user stats
  SELECT * INTO user_stat FROM user_stats WHERE user_id = p_user_id;
  
  -- Check each achievement
  FOR achievement IN SELECT * FROM achievements LOOP
    -- Skip if already earned
    IF EXISTS (SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_id = achievement.id) THEN
      CONTINUE;
    END IF;
    
    -- Check if requirements are met
    CASE achievement.requirement_type
      WHEN 'matches' THEN
        IF user_stat.total_matches >= achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          UPDATE user_stats SET experience_points = experience_points + achievement.points_reward WHERE user_id = p_user_id;
        END IF;
      WHEN 'conversations' THEN
        IF user_stat.total_conversations >= achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          UPDATE user_stats SET experience_points = experience_points + achievement.points_reward WHERE user_id = p_user_id;
        END IF;
      WHEN 'login_streak' THEN
        IF user_stat.login_streak >= achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          UPDATE user_stats SET experience_points = experience_points + achievement.points_reward WHERE user_id = p_user_id;
        END IF;
      WHEN 'profile_views' THEN
        IF user_stat.profile_views >= achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          UPDATE user_stats SET experience_points = experience_points + achievement.points_reward WHERE user_id = p_user_id;
        END IF;
      WHEN 'super_likes_received' THEN
        IF user_stat.super_likes_received >= achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement.id);
          UPDATE user_stats SET experience_points = experience_points + achievement.points_reward WHERE user_id = p_user_id;
        END IF;
    END CASE;
  END LOOP;
  
  -- Update level based on experience points
  UPDATE user_stats 
  SET level = GREATEST(1, experience_points / 1000 + 1)
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced matching algorithm function
CREATE OR REPLACE FUNCTION get_enhanced_compatible_profiles(
  user_uuid uuid,
  p_max_distance integer DEFAULT 50,
  p_age_min integer DEFAULT 18,
  p_age_max integer DEFAULT 99,
  p_filter_education_levels text[] DEFAULT '{}',
  p_filter_interests text[] DEFAULT '{}',
  p_filter_relationship_goals text[] DEFAULT '{}',
  p_height_min integer DEFAULT 0,
  p_height_max integer DEFAULT 999,
  p_body_types text[] DEFAULT '{}',
  p_ethnicities text[] DEFAULT '{}',
  p_religion text DEFAULT '',
  p_smoking text DEFAULT '',
  p_drinking text DEFAULT ''
)
RETURNS TABLE(
  id uuid,
  first_name text,
  bio text,
  occupation text,
  education text,
  location_city text,
  location_state text,
  date_of_birth date,
  height_cm integer,
  interests text[],
  relationship_goals text[],
  distance_km numeric,
  compatibility_score integer,
  boost_active boolean
) AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Get current user's profile
  SELECT * INTO user_profile FROM profiles WHERE profiles.id = user_uuid;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.bio,
    p.occupation,
    p.education::text,
    p.location_city,
    p.location_state,
    p.date_of_birth,
    p.height_cm,
    p.interests,
    p.relationship_goals,
    public.calculate_distance(
      user_profile.location_lat, user_profile.location_lng,
      p.location_lat, p.location_lng
    ) as distance_km,
    -- Enhanced compatibility scoring
    (
      -- Interest overlap (40% weight)
      COALESCE(array_length(array(SELECT unnest(p.interests) INTERSECT SELECT unnest(user_profile.interests)), 1), 0) * 8 +
      -- Relationship goals overlap (30% weight)
      COALESCE(array_length(array(SELECT unnest(p.relationship_goals) INTERSECT SELECT unnest(user_profile.relationship_goals)), 1), 0) * 15 +
      -- Education level compatibility (20% weight)
      CASE WHEN p.education = user_profile.education THEN 20 ELSE 0 END +
      -- Age compatibility (10% weight)
      CASE WHEN ABS(EXTRACT(YEAR FROM AGE(p.date_of_birth)) - EXTRACT(YEAR FROM AGE(user_profile.date_of_birth))) <= 5 THEN 10 ELSE 0 END +
      -- Lifestyle compatibility bonus
      CASE WHEN p.smoking = user_profile.smoking THEN 5 ELSE 0 END +
      CASE WHEN p.drinking = user_profile.drinking THEN 5 ELSE 0 END
    ) as compatibility_score,
    -- Check if user has active boost
    EXISTS(SELECT 1 FROM boosts WHERE boosts.user_id = p.id AND boosts.is_active = true AND boosts.expires_at > now()) as boost_active
  FROM profiles p
  WHERE p.id != user_uuid
    AND p.is_active = true
    -- Gender preference matching
    AND (user_profile.interested_in IS NULL OR array_length(user_profile.interested_in, 1) = 0 OR p.gender = ANY(user_profile.interested_in))
    AND (p.interested_in IS NULL OR array_length(p.interested_in, 1) = 0 OR user_profile.gender = ANY(p.interested_in))
    -- Age filter
    AND EXTRACT(YEAR FROM AGE(p.date_of_birth)) BETWEEN p_age_min AND p_age_max
    -- Height filter
    AND (p.height_cm IS NULL OR (p.height_cm >= p_height_min AND p.height_cm <= p_height_max))
    -- Education filter
    AND (array_length(p_filter_education_levels, 1) = 0 OR p.education::text = ANY(p_filter_education_levels))
    -- Interest filter
    AND (array_length(p_filter_interests, 1) = 0 OR p.interests && p_filter_interests)
    -- Relationship goals filter
    AND (array_length(p_filter_relationship_goals, 1) = 0 OR p.relationship_goals::text[] && p_filter_relationship_goals)
    -- Body type filter
    AND (array_length(p_body_types, 1) = 0 OR p.body_type = ANY(p_body_types))
    -- Ethnicity filter
    AND (array_length(p_ethnicities, 1) = 0 OR p.ethnicity = ANY(p_ethnicities))
    -- Religion filter
    AND (p_religion = '' OR p.religion = p_religion)
    -- Smoking filter
    AND (p_smoking = '' OR p.smoking = p_smoking)
    -- Drinking filter
    AND (p_drinking = '' OR p.drinking = p_drinking)
    -- Distance filter
    AND (
      p_max_distance <= 0 OR 
      user_profile.location_lat IS NULL OR 
      p.location_lat IS NULL OR
      public.calculate_distance(
        user_profile.location_lat, user_profile.location_lng,
        p.location_lat, p.location_lng
      ) <= p_max_distance
    )
    -- Exclude already swiped users
    AND NOT EXISTS (
      SELECT 1 FROM swipes s
      WHERE s.swiper_id = user_uuid AND s.swiped_id = p.id
    )
  ORDER BY 
    boost_active DESC, -- Boosted profiles first
    compatibility_score DESC, 
    distance_km ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
