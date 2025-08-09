-- First, let's see what profiles exist
SELECT COUNT(*) as profile_count FROM profiles;

-- Create comprehensive test profiles with proper data
INSERT INTO profiles (
  id, email, first_name, last_name, date_of_birth, gender, 
  interested_in, bio, occupation, location_city, location_state, 
  is_active, interests, relationship_goals, height_cm
) VALUES 
-- Beautiful Black women
(gen_random_uuid(), 'keisha.jones@test.com', 'Keisha', 'Jones', '1995-03-15', 'female', 
 ARRAY['male'], 'Creative soul with a passion for art and good vibes. Love traveling and trying new cuisines.', 
 'Graphic Designer', 'Lusaka', 'Zambia', true, 
 ARRAY['art', 'travel', 'food', 'music'], ARRAY['serious', 'casual'], 168),
 
(gen_random_uuid(), 'amara.mwanza@test.com', 'Amara', 'Mwanza', '1993-07-22', 'female', 
 ARRAY['male'], 'Entrepreneur building dreams. Love fitness, nature, and meaningful conversations.', 
 'Business Owner', 'Ndola', 'Zambia', true, 
 ARRAY['fitness', 'nature', 'business', 'reading'], ARRAY['serious'], 172),
 
(gen_random_uuid(), 'zara.banda@test.com', 'Zara', 'Banda', '1996-11-08', 'female', 
 ARRAY['male'], 'Doctor by day, adventurer by weekend. Seeking someone who shares my zest for life.', 
 'Doctor', 'Kitwe', 'Zambia', true, 
 ARRAY['medicine', 'adventure', 'hiking', 'cooking'], ARRAY['serious'], 165),
 
(gen_random_uuid(), 'nia.phiri@test.com', 'Nia', 'Phiri', '1994-05-12', 'female', 
 ARRAY['male'], 'Teacher with a big heart. Love children, books, and cozy movie nights.', 
 'Teacher', 'Kabwe', 'Zambia', true, 
 ARRAY['education', 'books', 'movies', 'children'], ARRAY['serious', 'casual'], 160),

-- Handsome Black men 
(gen_random_uuid(), 'marcus.tembo@test.com', 'Marcus', 'Tembo', '1992-01-20', 'male', 
 ARRAY['female'], 'Software engineer who loves building the future. Gym enthusiast and coffee connoisseur.', 
 'Software Engineer', 'Lusaka', 'Zambia', true, 
 ARRAY['technology', 'fitness', 'coffee', 'gaming'], ARRAY['serious'], 183),
 
(gen_random_uuid(), 'david.mulenga@test.com', 'David', 'Mulenga', '1990-09-14', 'male', 
 ARRAY['female'], 'Entrepreneur with big dreams. Love sports, music, and good company.', 
 'Entrepreneur', 'Livingstone', 'Zambia', true, 
 ARRAY['business', 'sports', 'music', 'networking'], ARRAY['serious', 'casual'], 178),
 
(gen_random_uuid(), 'kwame.sakala@test.com', 'Kwame', 'Sakala', '1991-12-03', 'male', 
 ARRAY['female'], 'Marketing manager with a creative mind. Love photography and exploring new places.', 
 'Marketing Manager', 'Chingola', 'Zambia', true, 
 ARRAY['marketing', 'photography', 'travel', 'creativity'], ARRAY['serious'], 180),
 
(gen_random_uuid(), 'jamal.chanda@test.com', 'Jamal', 'Chanda', '1993-04-18', 'male', 
 ARRAY['female'], 'Civil engineer building tomorrow. Enjoy music, dancing, and quality time with loved ones.', 
 'Civil Engineer', 'Mufulira', 'Zambia', true, 
 ARRAY['engineering', 'music', 'dancing', 'family'], ARRAY['serious'], 175);