
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const femaleFirstNames = [
  "Besa", "Chipo", "Dalitso", "Kondwani", "Ludo", "Mapalo", "Mumba", "Natasha",
  "Samba", "Thandiwe", "Wezi", "Zola", "Mwila", "Chilufya", "Mutinta", "Namukolo",
  "Kasuba", "Monde", "Temwani", "Naomi", "Esther", "Grace", "Precious", "Gift",
  "Charity", "Hope", "Faith", "Mercy", "Ruth", "Sarah"
];
const maleFirstNames = [
  "Banda", "Chibwe", "Daka", "Kabwe", "Lungu", "Moyo", "Ndhlovu", "Phiri",
  "Sichone", "Tembo", "Zaza", "Mutale", "Bwalya", "Chisanga", "Mwamba",
  "Kapambwe", "Kangwa", "Musonda", "Kalaba", "Mubanga"
];
const lastNames = [
  "Banda", "Phiri", "Mumba", "Tembo", "Sakala", "Lungu", "Daka", "Mwila",
  "Chanda", "Mulenga", "Soko", "Zimba", "Ng'andu", "Musonda", "Bwalya",
  "Mwape", "Kalumbi", "Chipimo", "Kaunda", "Zulu"
];
const occupations = [
  "Software Engineer", "Doctor", "Teacher", "Accountant", "Entrepreneur",
  "Marketing Manager", "Graphic Designer", "Civil Servant", "Nurse", "Farmer",
  "Lawyer", "Pharmacist", "Architect", "Journalist", "Chef",
  "Fashion Designer", "Real Estate Agent", "Bank Teller", "Pilot", "DJ",
  "Social Worker", "Fitness Trainer", "Content Creator", "Event Planner"
];
const educationLevels = ["high_school", "some_college", "bachelors", "masters", "phd", "trade_school"];
const relationshipGoals = ["casual", "serious", "friendship", "networking"];
const interestsList = [
  "Travel", "Music", "Sports", "Reading", "Cooking", "Dancing",
  "Photography", "Art", "Movies", "Fitness", "Nature", "Technology",
  "Fashion", "Business", "Education", "Culture", "Adventure"
];

const bioTemplates = [
  (n: string, o: string) => `Hey there! I'm ${n} 😊 ${o} by day, adventurer by night. Love exploring Lusaka's hidden gems.`,
  (n: string, o: string) => `${n} here ✨ Passionate ${o} who loves good music, great food, and meaningful conversations.`,
  (n: string, o: string) => `I'm ${n}, a ${o} with a love for travel and trying new restaurants. Let's grab coffee! ☕`,
  (n: string, o: string) => `Just a ${o} who believes life is too short for boring conversations. Ask me about my last trip! 🌍`,
  (n: string, o: string) => `${n} | ${o} | Lusaka 📍 Into fitness, cooking, and spontaneous road trips.`,
  (n: string, o: string) => `Hi! I'm ${n}. When I'm not working as a ${o}, you'll find me at the gym or trying a new recipe 🍳`,
  (n: string, o: string) => `${n} 🇿🇲 Proud Zambian, ${o}, and eternal optimist. Looking for genuine connections.`,
  (n: string, o: string) => `Life-loving ${o} who enjoys sunsets, live music, and deep talks. Let's vibe! 🎶`,
  (n: string, o: string) => `${n} here. ${o} with a creative side. Love art galleries, hiking, and weekend braais 🔥`,
  (n: string, o: string) => `Ambitious ${o} with a soft spot for dogs and jollof rice. Swipe right if you love both too! 🐕`,
  (n: string, o: string) => `${n} | Dreamer & ${o} | Always up for an adventure or a Netflix marathon 🎬`,
  (n: string, o: string) => `Simple soul, big dreams. ${o} trying to make the world a little better one day at a time 💛`,
];

const femalePhotoUrls = [
  "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1821095/pexels-photo-1821095.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/3936894/pexels-photo-3936894.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1758845/pexels-photo-1758845.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1898555/pexels-photo-1898555.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/3671083/pexels-photo-3671083.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/2726111/pexels-photo-2726111.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/3756616/pexels-photo-3756616.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?auto=compress&cs=tinysrgb&w=600",
];

const malePhotoUrls = [
  "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/3775540/pexels-photo-3775540.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/2380794/pexels-photo-2380794.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=600",
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      });
    }

    const { data: isAdmin } = await supabaseClient.rpc('has_role', { p_user_id: user.id, p_role: 'admin' });
    const { data: isSuperAdmin } = await supabaseClient.rpc('is_super_admin', { user_id: user.id });

    if (!isAdmin && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const body = await req.json().catch(() => ({}));
    const count = Math.min(body.count || 50, 200);

    console.log(`Starting generation of ${count} fake users...`);
    let created = 0;

    for (let i = 0; i < count; i++) {
      const isFemale = i < count * 0.7;
      const gender = isFemale ? "female" : "male";
      const firstName = isFemale ? pick(femaleFirstNames) : pick(maleFirstNames);
      const lastName = pick(lastNames);

      const randomNumber = Math.floor(Math.random() * 9000) + 1000;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randomNumber}@matchtime.com`;
      const password = "password123";

      const age = Math.floor(Math.random() * (35 - 20 + 1)) + 20;
      const year = new Date().getFullYear() - age;
      const dateOfBirth = `${year}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;

      const photoList = isFemale ? femalePhotoUrls : malePhotoUrls;
      const imageUrl = pick(photoList);
      const occupation = pick(occupations);
      const bio = pick(bioTemplates)(firstName, occupation);
      const education = pick(educationLevels);
      const selectedInterests = pickN(interestsList, Math.floor(Math.random() * 3) + 3);
      const selectedGoals = pickN(relationshipGoals, Math.floor(Math.random() * 2) + 1);

      // Lusaka coordinates with spread
      const baseLat = -15.3875;
      const baseLng = 28.3228;
      const latOffset = (Math.random() - 0.5) * 0.15;
      const lngOffset = (Math.random() - 0.5) * 0.15;

      // Sign up user
      const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email, password,
        options: { data: { first_name: firstName, last_name: lastName, date_of_birth: dateOfBirth, gender } },
      });

      let userId: string | null = null;
      if (authError || !authData.user) {
        if (authError?.message?.includes("User already registered")) {
          const { data: ep } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();
          if (!ep) continue;
          userId = ep.id;
        } else {
          console.error(`Error signing up ${email}:`, authError?.message);
          continue;
        }
      } else {
        userId = authData.user.id;
      }

      // Download & upload photo
      try {
        const remoteImage = await fetch(imageUrl);
        const imageBlob = await remoteImage.blob();
        const photoPath = `${userId}/${Date.now()}.png`;
        await supabaseAdmin.storage.from("profile-photos").upload(photoPath, imageBlob, { contentType: "image/png" });
        const { data: { publicUrl } } = supabaseAdmin.storage.from("profile-photos").getPublicUrl(photoPath);

        await supabaseAdmin.from("profile_photos").insert({
          user_id: userId, photo_url: publicUrl, is_primary: true, order_index: 0,
        });
      } catch (e) {
        console.error(`Photo upload failed for ${userId}:`, e);
      }

      // Update profile
      await supabaseAdmin.from("profiles").update({
        bio,
        occupation,
        education,
        location_city: "Lusaka",
        location_state: "Lusaka Province",
        location_lat: baseLat + latOffset,
        location_lng: baseLng + lngOffset,
        interested_in: [isFemale ? "male" : "female"],
        interests: selectedInterests,
        relationship_goals: selectedGoals,
        height_cm: Math.floor(Math.random() * 30) + 155,
        has_accommodation_available: Math.random() > 0.7,
      }).eq("id", userId);

      created++;
      if (created % 10 === 0) console.log(`Created ${created}/${count} users...`);
    }

    console.log(`Finished generating ${created} fake users.`);
    return new Response(JSON.stringify({ message: `Successfully generated ${created} users.` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
