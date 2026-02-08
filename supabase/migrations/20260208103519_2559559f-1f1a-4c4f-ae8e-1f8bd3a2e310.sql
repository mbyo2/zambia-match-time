-- Create a function to send push notifications via edge function
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_title text;
  notification_body text;
  target_user_id uuid;
  sender_name text;
  notification_data jsonb;
BEGIN
  -- Handle new matches
  IF TG_TABLE_NAME = 'matches' THEN
    -- Get sender names
    SELECT first_name INTO sender_name FROM profiles WHERE id = NEW.user1_id;
    
    -- Notify user2 about the match
    notification_title := 'New Match! 💕';
    notification_body := 'You matched with ' || COALESCE(sender_name, 'someone') || '!';
    notification_data := jsonb_build_object('type', 'match', 'match_id', NEW.id);
    
    -- Insert into notifications table (this will trigger the app's realtime subscription)
    INSERT INTO notifications (user_id, type, title, message, related_match_id, metadata)
    VALUES (NEW.user2_id, 'match', notification_title, notification_body, NEW.id, notification_data)
    ON CONFLICT DO NOTHING;
    
    -- Also notify user1
    SELECT first_name INTO sender_name FROM profiles WHERE id = NEW.user2_id;
    notification_body := 'You matched with ' || COALESCE(sender_name, 'someone') || '!';
    
    INSERT INTO notifications (user_id, type, title, message, related_match_id, metadata)
    VALUES (NEW.user1_id, 'match', notification_title, notification_body, NEW.id, notification_data)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Handle new messages
  IF TG_TABLE_NAME = 'messages' THEN
    -- Get the conversation's match to find the recipient
    SELECT 
      CASE 
        WHEN m.user1_id = NEW.sender_id THEN m.user2_id
        ELSE m.user1_id
      END,
      p.first_name
    INTO target_user_id, sender_name
    FROM conversations c
    JOIN matches m ON c.match_id = m.id
    JOIN profiles p ON p.id = NEW.sender_id
    WHERE c.id = NEW.conversation_id;
    
    IF target_user_id IS NOT NULL THEN
      notification_title := COALESCE(sender_name, 'Someone') || ' sent you a message';
      notification_body := LEFT(COALESCE(NEW.content, 'Sent a photo'), 50);
      notification_data := jsonb_build_object(
        'type', 'message', 
        'conversation_id', NEW.conversation_id,
        'sender_id', NEW.sender_id
      );
      
      INSERT INTO notifications (user_id, type, title, message, related_user_id, metadata)
      VALUES (target_user_id, 'message', notification_title, notification_body, NEW.sender_id, notification_data)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for new matches
DROP TRIGGER IF EXISTS trigger_match_notification ON matches;
CREATE TRIGGER trigger_match_notification
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_notification();

-- Create trigger for new messages  
DROP TRIGGER IF EXISTS trigger_message_notification ON messages;
CREATE TRIGGER trigger_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_notification();