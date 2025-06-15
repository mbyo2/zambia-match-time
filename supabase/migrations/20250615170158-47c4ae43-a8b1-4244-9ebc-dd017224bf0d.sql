
-- Drop tables with foreign key dependencies first
DROP TABLE IF EXISTS public.event_accommodations;
DROP TABLE IF EXISTS public.accommodations;
DROP TABLE IF EXISTS public.user_roles;

-- Drop the helper function and ENUM types
DROP FUNCTION IF EXISTS public.has_role(p_user_id uuid, p_role public.app_role);
DROP TYPE IF EXISTS public.accommodation_type;
DROP TYPE IF EXISTS public.app_role;
