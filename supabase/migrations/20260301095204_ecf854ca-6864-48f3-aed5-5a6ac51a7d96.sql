INSERT INTO public.user_roles (user_id, role)
VALUES ('b2d175b0-3e93-458c-9704-47fdbb77a012', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;