
-- Create notifications table for push notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  type text NOT NULL, -- 'match', 'message', 'like', 'super_like', 'boost', 'achievement'
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  related_user_id uuid REFERENCES profiles(id),
  related_match_id uuid REFERENCES matches(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create push_subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  subscription jsonb NOT NULL, -- WebPush subscription object
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_analytics table for behavior tracking
CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  event_type text NOT NULL, -- 'page_view', 'swipe', 'match', 'message_sent', 'profile_edit'
  event_data jsonb DEFAULT '{}',
  session_id text,
  user_agent text,
  ip_address inet,
  created_at timestamp with time zone DEFAULT now()
);

-- Create content_moderation table
CREATE TABLE IF NOT EXISTS content_moderation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL, -- 'profile_photo', 'message', 'bio', 'prompt_response'
  content_id uuid NOT NULL, -- ID of the content being moderated
  user_id uuid REFERENCES profiles(id) NOT NULL,
  moderation_status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'flagged'
  ai_confidence_score numeric DEFAULT 0, -- 0-1 confidence score from AI
  flagged_reasons text[], -- Array of reasons: 'nudity', 'violence', 'hate_speech', etc.
  reviewed_by uuid REFERENCES profiles(id), -- Admin who reviewed
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Create reports table for user reporting system
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) NOT NULL,
  reported_id uuid REFERENCES profiles(id) NOT NULL,
  content_type text DEFAULT 'profile', -- 'profile', 'message', 'photo'
  content_metadata jsonb,
  reason text NOT NULL, -- 'inappropriate_content', 'fake_profile', 'harassment', etc.
  description text,
  status text DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES profiles(id) NOT NULL,
  blocked_id uuid REFERENCES profiles(id) NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create friend_referrals table
CREATE TABLE IF NOT EXISTS friend_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES profiles(id) NOT NULL,
  referred_email text NOT NULL,
  referred_user_id uuid REFERENCES profiles(id), -- Set when they sign up
  referral_code text UNIQUE NOT NULL,
  reward_claimed boolean DEFAULT false,
  reward_type text DEFAULT 'super_likes', -- 'super_likes', 'boost', 'premium_trial'
  reward_value integer DEFAULT 3,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Create social_connections table for external integrations
CREATE TABLE IF NOT EXISTS social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  platform text NOT NULL, -- 'instagram', 'spotify', 'tiktok', 'linkedin'
  platform_user_id text NOT NULL,
  platform_username text,
  access_token text, -- Encrypted token for API access
  profile_data jsonb DEFAULT '{}', -- Cached profile data
  is_active boolean DEFAULT true,
  connected_at timestamp with time zone DEFAULT now(),
  last_sync timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Create social_events table
CREATE TABLE IF NOT EXISTS social_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text NOT NULL, -- 'meetup', 'party', 'activity', 'workshop'
  location_name text,
  location_address text,
  location_lat numeric,
  location_lng numeric,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  max_participants integer,
  age_min integer DEFAULT 18,
  age_max integer DEFAULT 99,
  cost_cents integer DEFAULT 0, -- Cost in cents
  organizer_id uuid REFERENCES profiles(id) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES social_events(id) NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  status text DEFAULT 'registered', -- 'registered', 'attended', 'no_show', 'cancelled'
  registered_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create success_stories table
CREATE TABLE IF NOT EXISTS success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES profiles(id) NOT NULL,
  user2_id uuid REFERENCES profiles(id) NOT NULL,
  story_text text NOT NULL,
  relationship_status text NOT NULL, -- 'dating', 'engaged', 'married'
  photo_url text,
  is_featured boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  submitted_at timestamp with time zone DEFAULT now(),
  approved_at timestamp with time zone
);

-- Create mood_updates table for mood-based matching
CREATE TABLE IF NOT EXISTS mood_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  mood text NOT NULL, -- 'adventurous', 'chill', 'romantic', 'energetic', 'creative'
  activity text, -- 'working_out', 'reading', 'exploring', 'cooking', 'partying'
  location_name text,
  expires_at timestamp with time zone DEFAULT (now() + interval '4 hours'),
  created_at timestamp with time zone DEFAULT now()
);

-- Create skills_hobbies table
CREATE TABLE IF NOT EXISTS skills_hobbies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL, -- 'sport', 'art', 'music', 'technology', 'cooking', 'outdoor'
  icon text,
  is_active boolean DEFAULT true
);

-- Create user_skills table
CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  skill_id uuid REFERENCES skills_hobbies(id) NOT NULL,
  proficiency_level text DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced', 'expert'
  is_teaching boolean DEFAULT false, -- Can teach others
  is_learning boolean DEFAULT false, -- Want to learn
  added_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- Create saved_searches table for advanced search
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  name text NOT NULL,
  search_criteria jsonb NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- User analytics policies (restricted - only for internal use)
-- CREATE POLICY "Service can insert analytics" ON user_analytics FOR INSERT WITH CHECK (true);

-- Content moderation policies (restricted - admin only)
-- Reports policies
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- User blocks policies
CREATE POLICY "Users can manage their own blocks" ON user_blocks FOR ALL USING (blocker_id = auth.uid());

-- Friend referrals policies
CREATE POLICY "Users can view their referrals" ON friend_referrals FOR SELECT USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());
CREATE POLICY "Users can create referrals" ON friend_referrals FOR INSERT WITH CHECK (referrer_id = auth.uid());

-- Social connections policies
CREATE POLICY "Users can manage their social connections" ON social_connections FOR ALL USING (user_id = auth.uid());

-- Social events policies
CREATE POLICY "Everyone can view active events" ON social_events FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Users can create events" ON social_events FOR INSERT WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "Organizers can manage their events" ON social_events FOR ALL USING (organizer_id = auth.uid());

-- Event participants policies
CREATE POLICY "Users can manage their event participation" ON event_participants FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Organizers can view participants" ON event_participants FOR SELECT USING (
  EXISTS(SELECT 1 FROM social_events WHERE id = event_id AND organizer_id = auth.uid())
);

-- Success stories policies
CREATE POLICY "Everyone can view approved stories" ON success_stories FOR SELECT TO authenticated USING (is_approved = true);
CREATE POLICY "Users can submit their stories" ON success_stories FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- Mood updates policies
CREATE POLICY "Users can manage their mood updates" ON mood_updates FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view recent mood updates" ON mood_updates FOR SELECT TO authenticated USING (expires_at > now());

-- Skills and hobbies policies
CREATE POLICY "Everyone can view skills" ON skills_hobbies FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Users can manage their skills" ON user_skills FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view others' skills for matching" ON user_skills FOR SELECT TO authenticated USING (true);

-- Saved searches policies
CREATE POLICY "Users can view their own saved searches" ON saved_searches FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own saved searches" ON saved_searches FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own saved searches" ON saved_searches FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own saved searches" ON saved_searches FOR DELETE USING (user_id = auth.uid());

-- Insert sample skills and hobbies
INSERT INTO skills_hobbies (name, category, icon) VALUES
-- Sports
('Tennis', 'sport', '🎾'),
('Basketball', 'sport', '🏀'),
('Soccer', 'sport', '⚽'),
('Swimming', 'sport', '🏊'),
('Yoga', 'sport', '🧘'),
('Rock Climbing', 'sport', '🧗'),
('Running', 'sport', '🏃'),
('Cycling', 'sport', '🚴'),
-- Arts
('Photography', 'art', '📸'),
('Painting', 'art', '🎨'),
('Drawing', 'art', '✏️'),
('Sculpture', 'art', '🗿'),
('Pottery', 'art', '🏺'),
-- Music
('Guitar', 'music', '🎸'),
('Piano', 'music', '🎹'),
('Singing', 'music', '🎤'),
('Drums', 'music', '🥁'),
('DJing', 'music', '🎧'),
-- Technology
('Programming', 'technology', '💻'),
('Web Design', 'technology', '🌐'),
('Video Editing', 'technology', '🎬'),
('Gaming', 'technology', '🎮'),
-- Cooking
('Cooking', 'cooking', '👨‍🍳'),
('Baking', 'cooking', '🧁'),
('Wine Tasting', 'cooking', '🍷'),
('Coffee Brewing', 'cooking', '☕'),
-- Outdoor
('Hiking', 'outdoor', '🥾'),
('Camping', 'outdoor', '⛺'),
('Fishing', 'outdoor', '🎣'),
('Gardening', 'outdoor', '🌱'),
('Surfing', 'outdoor', '🏄');

-- Create function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
BEGIN
  RETURN upper(substring(encode(gen_random_bytes(4), 'base64') from 1 for 6));
END;
$$ LANGUAGE plpgsql;

-- Create function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  related_user_id uuid DEFAULT NULL,
  related_match_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, 
    type, 
    title, 
    message, 
    related_user_id, 
    related_match_id
  )
  VALUES (
    target_user_id, 
    notification_type, 
    notification_title, 
    notification_message, 
    related_user_id, 
    related_match_id
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(notification_ids uuid[])
RETURNS void AS $$
BEGIN
  UPDATE public.notifications 
  SET is_read = true, updated_at = now()
  WHERE id = ANY(notification_ids) 
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced trigger for match creation with notifications
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
DECLARE
  match_id UUID;
  user1_profile RECORD;
  user2_profile RECORD;
BEGIN
  -- Check if there's a mutual like
  IF NEW.action = 'like' AND EXISTS (
    SELECT 1 FROM public.swipes 
    WHERE swiper_id = NEW.swiped_id 
    AND swiped_id = NEW.swiper_id 
    AND action = 'like'
  ) THEN
    -- Create a match (ensure user1_id < user2_id for consistency)
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.swiper_id, NEW.swiped_id),
      GREATEST(NEW.swiper_id, NEW.swiped_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING
    RETURNING id INTO match_id;
    
    -- Create a conversation for the match
    INSERT INTO public.conversations (match_id)
    VALUES (match_id)
    ON CONFLICT DO NOTHING;
    
    -- Get profile names for notifications
    SELECT first_name INTO user1_profile FROM public.profiles WHERE id = NEW.swiper_id;
    SELECT first_name INTO user2_profile FROM public.profiles WHERE id = NEW.swiped_id;
    
    -- Create notifications for both users
    PERFORM public.create_notification(
      NEW.swiper_id,
      'match',
      'New Match!',
      'You have a new match with ' || COALESCE(user2_profile.first_name, 'someone'),
      NEW.swiped_id,
      match_id
    );
    
    PERFORM public.create_notification(
      NEW.swiped_id,
      'match',
      'New Match!',
      'You have a new match with ' || COALESCE(user1_profile.first_name, 'someone'),
      NEW.swiper_id,
      match_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_mutual_like ON swipes;
CREATE TRIGGER on_mutual_like
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();
