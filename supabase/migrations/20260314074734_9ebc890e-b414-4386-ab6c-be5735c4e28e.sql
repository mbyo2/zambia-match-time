
-- 1. Message reactions table
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own reactions
CREATE POLICY "Users can manage their own reactions"
ON public.message_reactions
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can view reactions on messages in their conversations
CREATE POLICY "Users can view reactions in their conversations"
ON public.message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    JOIN matches mt ON c.match_id = mt.id
    WHERE m.id = message_reactions.message_id
    AND (mt.user1_id = auth.uid() OR mt.user2_id = auth.uid())
  )
);

-- 2. Daily rewards INSERT policy via security definer function
CREATE OR REPLACE FUNCTION public.create_daily_reward(p_user_id uuid, p_reward_type text, p_reward_value integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  reward_id uuid;
BEGIN
  -- Only allow creating reward for yourself
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create rewards for other users';
  END IF;
  
  -- Check if reward already exists for today
  IF EXISTS (
    SELECT 1 FROM daily_rewards 
    WHERE user_id = p_user_id AND reward_date = CURRENT_DATE
  ) THEN
    SELECT id INTO reward_id FROM daily_rewards 
    WHERE user_id = p_user_id AND reward_date = CURRENT_DATE;
    RETURN reward_id;
  END IF;
  
  INSERT INTO daily_rewards (user_id, reward_type, reward_value, reward_date)
  VALUES (p_user_id, p_reward_type, p_reward_value, CURRENT_DATE)
  RETURNING id INTO reward_id;
  
  RETURN reward_id;
END;
$$;

-- 3. Add user_settings columns to profiles for privacy settings persistence
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"show_online_status": true, "location_sharing": true, "allow_message_requests": true, "block_screenshots": false}'::jsonb;
