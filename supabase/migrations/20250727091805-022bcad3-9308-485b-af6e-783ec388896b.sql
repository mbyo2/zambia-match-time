-- Add some initial test users and achievements for development
INSERT INTO public.achievements (name, description, icon, requirement_type, requirement_value, points_reward) VALUES
  ('First Match', 'Get your first match!', '💕', 'matches', 1, 100),
  ('Conversation Starter', 'Start your first conversation', '💬', 'conversations', 1, 50),
  ('Popular Profile', 'Get 10 profile views', '👁️', 'profile_views', 10, 200),
  ('Love Giver', 'Give 50 likes', '❤️', 'likes_given', 50, 150),
  ('Super Star', 'Receive 5 super likes', '⭐', 'super_likes_received', 5, 300)
ON CONFLICT (name) DO NOTHING;

-- Add some sample icebreaker prompts
INSERT INTO public.icebreaker_prompts (prompt_text, category) VALUES
  ('What''s your favorite way to spend a weekend?', 'lifestyle'),
  ('If you could travel anywhere right now, where would you go?', 'travel'),
  ('What''s the last book/movie that made you think?', 'culture'),
  ('What''s your biggest goal this year?', 'personal'),
  ('Coffee or tea, and how do you take it?', 'lifestyle'),
  ('What''s something you''re passionate about?', 'personal'),
  ('Describe your perfect date in three words', 'dating'),
  ('What''s your hidden talent?', 'fun'),
  ('Mountains or beach vacation?', 'travel'),
  ('What''s your go-to comfort food?', 'lifestyle')
ON CONFLICT (prompt_text) DO NOTHING;