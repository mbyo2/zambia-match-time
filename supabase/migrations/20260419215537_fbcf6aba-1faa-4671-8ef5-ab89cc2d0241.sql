CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  match_id UUID;
  user1_profile RECORD;
  user2_profile RECORD;
BEGIN
  IF NEW.action = 'like' AND EXISTS (
    SELECT 1 FROM public.swipes 
    WHERE swiper_id = NEW.swiped_id 
    AND swiped_id = NEW.swiper_id 
    AND action = 'like'
  ) THEN
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.swiper_id, NEW.swiped_id),
      GREATEST(NEW.swiper_id, NEW.swiped_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING
    RETURNING id INTO match_id;
    
    IF match_id IS NOT NULL THEN
      INSERT INTO public.conversations (match_id)
      VALUES (match_id)
      ON CONFLICT DO NOTHING;
      
      SELECT first_name INTO user1_profile FROM public.profiles WHERE id = NEW.swiper_id;
      SELECT first_name INTO user2_profile FROM public.profiles WHERE id = NEW.swiped_id;
      
      PERFORM public.create_notification(
        NEW.swiper_id, 'match', 'New Match!',
        'You have a new match with ' || COALESCE(user2_profile.first_name, 'someone'),
        NEW.swiped_id, match_id
      );
      PERFORM public.create_notification(
        NEW.swiped_id, 'match', 'New Match!',
        'You have a new match with ' || COALESCE(user1_profile.first_name, 'someone'),
        NEW.swiper_id, match_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;